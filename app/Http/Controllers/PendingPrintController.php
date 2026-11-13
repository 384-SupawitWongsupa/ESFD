<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\License;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PendingPrintController extends Controller
{
    /**
     * รายการสถานประกอบการที่ยังไม่ได้พิมพ์ใบ อภ.๒
     * หมายถึง: ใบอนุญาต active ที่ is_printed = false
     */
    public function index(Request $request)
    {
        $filterStatus = $request->query('status', 'all'); // 'all' | 'pending_inspection' | 'inspected'
        $search = trim($request->query('q', ''));

        $query = Business::with([
            'owner',
            'category',
            'licenses' => fn($q) => $q->latest('expire_date'),
            'inspectionRecords.round',
        ])
        ->whereHas('licenses', fn($q) => $q->where('is_printed', false)->where('status', 'active'));

        if ($filterStatus === 'pending_inspection') {
            $query->where('inspection_status', 'pending');
        } elseif ($filterStatus === 'inspected') {
            $query->where('inspection_status', 'inspected');
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('shop_name', 'like', "%{$search}%")
                  ->orWhereHas('owner', fn($oq) => $oq->where('owner_name', 'like', "%{$search}%")
                      ->orWhere('citizen_id', 'like', "%{$search}%"));
            });
        }

        $businesses = $query->latest()->paginate(20)->withQueryString();

        // สรุปสถิติ
        $totalPending = Business::whereHas(
            'licenses', fn($q) => $q->where('is_printed', false)->where('status', 'active')
        )->count();

        $pendingInspection = Business::whereHas(
            'licenses', fn($q) => $q->where('is_printed', false)->where('status', 'active')
        )->where('inspection_status', 'pending')->count();

        $inspectedNotPrinted = Business::whereHas(
            'licenses', fn($q) => $q->where('is_printed', false)->where('status', 'active')
        )->where('inspection_status', 'inspected')->count();

        return Inertia::render('PendingPrint/Index', [
            'businesses' => $businesses,
            'filters' => [
                'q' => $search,
                'status' => $filterStatus,
            ],
            'stats' => [
                'total' => $totalPending,
                'pending_inspection' => $pendingInspection,
                'inspected_not_printed' => $inspectedNotPrinted,
            ],
        ]);
    }

    /**
     * บันทึกสถานะ "พิมพ์แล้ว" สำหรับใบอนุญาต
     */
    public function markPrinted(Request $request, $businessId)
    {
        $license = License::where('business_id', $businessId)
            ->where('status', 'active')
            ->latest('expire_date')
            ->firstOrFail();

        $license->update([
            'is_printed' => true,
            'printed_at' => now(),
        ]);

        return back()->with('success', 'บันทึกสถานะพิมพ์ใบ อภ.๒ เรียบร้อยแล้ว');
    }
}

