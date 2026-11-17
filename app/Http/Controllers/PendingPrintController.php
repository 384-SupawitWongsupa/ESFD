<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\InspectionRound;
use App\Models\License;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PendingPrintController extends Controller
{
    /**
     * แสดงรายการสถานะกิจการ
     * - ทั้งหมด: กิจการทุกแห่งในระบบ
     * - ยังไม่ได้ออกตรวจ (รอตรวจ): pending_inspection หรือ inspection_status = 'pending'
     * - ออกตรวจแล้ว รอพิมพ์ใบ อภ.๒: pending_print หรือออกตรวจแล้วแต่ยังไม่พิมพ์
     * - พิมพ์ใบอนุญาตแล้ว (เสร็จสิ้น): completed หรือ active + is_printed
     */
    public function index(Request $request)
    {
        $filterStatus = $request->query('status', 'all'); // 'all' | 'pending_inspection' | 'inspected' | 'completed'
        $search = trim($request->query('q', ''));

        $query = Business::with([
            'owner',
            'category',
            'licenses' => fn($q) => $q->latest('expire_date'),
            'inspectionRecords.round',
        ]);

        if ($filterStatus === 'pending_inspection') {
            $query->where(function ($q) {
                $q->where('inspection_status', 'pending')
                  ->orWhere('workflow_status', 'pending_inspection')
                  ->orWhere('workflow_status', 'pending_request');
            })
            ->where('workflow_status', '!=', 'completed')
            ->whereDoesntHave('licenses', fn($lq) => $lq->where('is_printed', true)->where('status', 'active'));
        } elseif ($filterStatus === 'inspected') {
            $query->where(function ($q) {
                $q->where('workflow_status', 'pending_print')
                  ->orWhere(function ($sq) {
                      $sq->where('inspection_status', 'inspected');
                  });
            })
            ->where('workflow_status', '!=', 'completed')
            ->whereDoesntHave('licenses', fn($lq) => $lq->where('is_printed', true)->where('status', 'active'));
        } elseif ($filterStatus === 'completed') {
            $query->where(function ($q) {
                $q->where('workflow_status', 'completed')
                  ->orWhereHas('licenses', fn($lq) => $lq->where('is_printed', true)->where('status', 'active'));
            });
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('shop_name', 'like', "%{$search}%")
                  ->orWhere('operation_type', 'like', "%{$search}%")
                  ->orWhereHas('owner', fn($oq) => $oq->where('owner_name', 'like', "%{$search}%")
                      ->orWhere('citizen_id', 'like', "%{$search}%"));
            });
        }

        $businesses = $query->latest('updated_at')->paginate(20)->withQueryString();

        // สรุปสถิติตามสถานะจริง
        $totalBusinesses = Business::count();

        $pendingInspection = Business::where(function ($q) {
            $q->where('inspection_status', 'pending')
              ->orWhere('workflow_status', 'pending_inspection')
              ->orWhere('workflow_status', 'pending_request');
        })
        ->where('workflow_status', '!=', 'completed')
        ->whereDoesntHave('licenses', fn($lq) => $lq->where('is_printed', true)->where('status', 'active'))
        ->count();

        $inspectedNotPrinted = Business::where(function ($q) {
            $q->where('workflow_status', 'pending_print')
              ->orWhere(function ($sq) {
                  $sq->where('inspection_status', 'inspected');
              });
        })
        ->where('workflow_status', '!=', 'completed')
        ->whereDoesntHave('licenses', fn($lq) => $lq->where('is_printed', true)->where('status', 'active'))
        ->count();

        $completed = Business::where(function ($q) {
            $q->where('workflow_status', 'completed')
              ->orWhereHas('licenses', fn($lq) => $lq->where('is_printed', true)->where('status', 'active'));
        })->count();

        return Inertia::render('PendingPrint/Index', [
            'businesses' => $businesses,
            'filters' => [
                'q' => $search,
                'status' => $filterStatus,
            ],
            'stats' => [
                'total' => $totalBusinesses,
                'pending_inspection' => $pendingInspection,
                'inspected_not_printed' => $inspectedNotPrinted,
                'completed' => $completed,
            ],
            'rounds' => InspectionRound::orderBy('inspection_date', 'desc')->get(),
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
            ->first();

        if ($license) {
            $license->update([
                'is_printed' => true,
                'printed_at' => now(),
            ]);
        }

        Business::where('business_id', $businessId)->update([
            'workflow_status' => 'completed',
        ]);

        return redirect()->route('pending-print.index', ['status' => 'completed'])
            ->with('success', 'บันทึกสถานะพิมพ์ใบ อภ.๒ เรียบร้อยแล้ว — รายชื่อถูกย้ายไปที่สถานะพิมพ์ใบอนุญาตแล้ว');
    }
}
