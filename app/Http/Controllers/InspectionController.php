<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\InspectionRecord;
use App\Models\InspectionRound;
use App\Models\License;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class InspectionController extends Controller
{
    public function index(Request $request)
    {
        $rounds = InspectionRound::withCount('inspectionRecords')
            ->orderBy('inspection_date', 'desc')
            ->get();

        $selectedRoundId = $request->query('round_id');
        $recordsQuery = InspectionRecord::with(['business.owner', 'business.category', 'round']);

        if ($selectedRoundId) {
            $recordsQuery->where('round_id', $selectedRoundId);
        }

        $records = $recordsQuery->latest()->paginate(15)->withQueryString();

        $businesses = Business::with(['owner', 'licenses' => function ($q) {
            $q->latest();
        }])->orderBy('shop_name')->get();

        return Inertia::render('Inspection/Index', [
            'rounds' => $rounds,
            'records' => $records,
            'selectedRoundId' => $selectedRoundId,
            'businesses' => $businesses,
        ]);
    }

    public function storeRound(Request $request)
    {
        $validated = $request->validate([
            'round_name' => 'required|string|max:100|unique:inspection_rounds,round_name',
            'inspection_date' => 'required|date',
        ]);

        InspectionRound::create($validated);

        return back()->with('success', 'สร้างรอบการออกตรวจใหม่เรียบร้อยแล้ว');
    }

    public function recordInspection(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|exists:businesses,business_id',
            'round_id' => 'nullable|string',
            'new_round_name' => 'nullable|string|max:100',
            'new_round_date' => 'nullable|date',
            'condition_4_3' => 'nullable|string',
            'condition_4_4' => 'nullable|string',
            'fee' => 'nullable|numeric|min:0',
            'receipt_book' => 'nullable|string|max:50',
            'receipt_no' => 'nullable|string|max:50',
            'receipt_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'file_url' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240', // 10MB
        ]);

        $fileUrl = $validated['file_url'] ?? null;

        // อัปโหลดไฟล์หลักฐาน (หากแนบไฟล์มา)
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('inspections', 'public');
            $fileUrl = Storage::url($path);
        }

        // ตรวจสอบหรือสร้างรอบการออกตรวจใหม่ (หากระบุสร้างเองบนหน้าบันทึกผล)
        $roundId = $validated['round_id'] ?? null;
        if ($roundId === 'new' || !empty($validated['new_round_name'])) {
            $roundName = trim($validated['new_round_name'] ?? '');
            if (empty($roundName)) {
                $roundName = 'ออกตรวจรอบพิเศษ ' . date('d/m/Y');
            }
            $roundDate = !empty($validated['new_round_date']) ? $validated['new_round_date'] : ($validated['receipt_date'] ?? now()->format('Y-m-d'));

            $round = InspectionRound::firstOrCreate(
                ['round_name' => $roundName],
                ['inspection_date' => $roundDate]
            );
            $roundId = $round->round_id;
        } else {
            if (empty($roundId)) {
                $firstRound = InspectionRound::first();
                $roundId = $firstRound ? $firstRound->round_id : 1;
            }
        }

        $cond43 = !empty(trim($validated['condition_4_3'] ?? '')) ? trim($validated['condition_4_3']) : 'ไม่มี';
        $cond44 = !empty(trim($validated['condition_4_4'] ?? '')) ? trim($validated['condition_4_4']) : 'ไม่มี';

        DB::transaction(function () use ($validated, $fileUrl, $roundId, $cond43, $cond44) {
            // บันทึกหรืออัปเดตผลการตรวจในรอบนี้ (ป้องกันบันทึกซ้ำตาม Unique Constraint)
            $record = InspectionRecord::updateOrCreate(
                [
                    'round_id' => $roundId,
                    'business_id' => $validated['business_id'],
                ],
                [
                    'condition_4_3' => $cond43,
                    'condition_4_4' => $cond44,
                    'file_url' => $fileUrl,
                    'notes' => $validated['notes'] ?? null,
                ]
            );
            $record->touch(); // อัปเดตเวลาล่าสุดเสมอ เพื่อให้ขึ้นอันดับแรกในแดชบอร์ดทันที

            // อัปเดตสถานะการออกตรวจและขั้นตอนของสถานประกอบการ
            Business::where('business_id', $validated['business_id'])
                ->update([
                    'inspection_status' => 'inspected',
                    'workflow_status' => 'pending_print',
                ]);
            Business::find($validated['business_id'])?->touch();

            // คำนวณวันหมดอายุใหม่ล่วงหน้า 1 ปี
            $receiptDate = !empty($validated['receipt_date']) ? Carbon::parse($validated['receipt_date']) : Carbon::today();
            $newExpireDate = $receiptDate->copy()->addYear();

            // ทำเครื่องหมายใบอนุญาตเก่าทั้งหมดของธุรกิจนี้เป็น renewed (ทั้ง active และ expired)
            License::where('business_id', $validated['business_id'])
                ->whereIn('status', ['active', 'expired'])
                ->update(['status' => 'renewed']);

            // สร้างรายการใบอนุญาตใหม่
            License::create([
                'business_id' => $validated['business_id'],
                'fee' => $validated['fee'] ?? 0.00,
                'receipt_book' => $validated['receipt_book'] ?? null,
                'receipt_no' => $validated['receipt_no'] ?? null,
                'receipt_date' => $receiptDate,
                'expire_date' => $newExpireDate,
                'status' => 'active',
                'is_printed' => false,
            ]);
        });

        return back()->with('success', 'บันทึกผลการออกตรวจและต่ออายุใบอนุญาตสำเร็จแล้ว พร้อมพิมพ์เอกสาร');
    }
}

