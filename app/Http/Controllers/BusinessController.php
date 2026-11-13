<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessCategory;
use App\Models\License;
use App\Models\Owner;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BusinessController extends Controller
{
    public function create()
    {
        $categories = BusinessCategory::all();
        $nextBusinessId = (Business::max('business_id') ?? 0) + 1;

        return Inertia::render('Business/Create', [
            'categories' => $categories,
            'nextBusinessId' => $nextBusinessId,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // เจ้าของ
            'citizen_id' => 'nullable|string|max:20',
            'juristic_id' => 'nullable|string|max:50',
            'owner_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'office_address' => 'nullable|string|max:255',
            'moo' => 'nullable|string|max:10',
            'subdistrict' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'province' => 'required|string|max:100',

            // กิจการ
            'category_id' => 'required|exists:business_categories,category_id',
            'shop_name' => 'nullable|string|max:255',
            'operation_type' => 'required|string',
            'shop_address' => 'nullable|string|max:255',
            'shop_moo' => 'nullable|string|max:10',
            'shop_phone' => 'nullable|string|max:50',
            'business_area' => 'nullable|string|max:100',
            'machine_power' => 'nullable|string|max:100',
            'worker_count' => 'nullable|string|max:50',
        ]);

        DB::transaction(function () use ($validated, &$business) {
            // ค้นหาหรือสร้างผู้ประกอบการ (Owner)
            $owner = null;
            if (!empty($validated['citizen_id'])) {
                $owner = Owner::where('citizen_id', $validated['citizen_id'])->first();
            }

            if (!$owner) {
                $owner = Owner::create([
                    'citizen_id' => $validated['citizen_id'] ?? null,
                    'juristic_id' => $validated['juristic_id'] ?? null,
                    'owner_name' => $validated['owner_name'],
                    'phone' => $validated['phone'] ?? null,
                    'office_address' => $validated['office_address'] ?? null,
                    'moo' => $validated['moo'] ?? null,
                    'subdistrict' => $validated['subdistrict'] ?? 'ดอยงาม',
                    'district' => $validated['district'] ?? 'พาน',
                    'province' => $validated['province'] ?? 'เชียงราย',
                ]);
            } else {
                // ปรับปรุงข้อมูลติดต่อหากมีการเปลี่ยนแปลง
                $owner->update(array_filter([
                    'phone' => $validated['phone'] ?? $owner->phone,
                    'office_address' => $validated['office_address'] ?? $owner->office_address,
                    'moo' => $validated['moo'] ?? $owner->moo,
                ]));
            }

            // สถานประกอบการใหม่: ตั้งสถานะเริ่มต้นเป็น 'รอออกใบคำขอ' (pending_request)
            // เพื่อให้เจ้าหน้าที่กดออกใบคำขอ (สธ.๒) ก่อน จึงจะปรับสถานะเป็น 'รอออกตรวจ'
            $business = Business::create([
                'owner_id' => $owner->owner_id,
                'category_id' => $validated['category_id'],
                'shop_name' => $validated['shop_name'] ?? null,
                'operation_type' => $validated['operation_type'],
                'shop_address' => $validated['shop_address'] ?? null,
                'shop_moo' => $validated['shop_moo'] ?? null,
                'shop_phone' => $validated['shop_phone'] ?? null,
                'business_area' => $validated['business_area'] ?? null,
                'machine_power' => $validated['machine_power'] ?? null,
                'worker_count' => $validated['worker_count'] ?? null,
                'inspection_status' => 'pending',
                'workflow_status' => 'pending_request',
                'request_date' => null,
                'request_no' => null,
            ]);
        });

        return redirect()->route('search.index', ['q' => $validated['shop_name'] ?? $validated['owner_name']])
            ->with('success', 'ลงทะเบียนสถานประกอบการใหม่เรียบร้อยแล้ว — สถานะ: รอออกใบคำขอ (กรุณากดออกใบคำขอก่อนเข้าสู่ขั้นตอนรอออกตรวจ)');
    }

    public function issueRequest($id)
    {
        $business = Business::findOrFail($id);
        $business->update([
            'workflow_status' => 'pending_inspection',
            'inspection_status' => 'pending',
            'request_date' => Carbon::today(),
            'request_no' => 'REQ-' . date('Ymd') . '-' . str_pad($business->business_id, 4, '0', STR_PAD_LEFT),
        ]);

        return redirect()->route('documents.preview', ['businessId' => $business->business_id])
            ->with('success', 'ออกใบคำขอรับใบอนุญาต (แบบ สธ.๒) เรียบร้อยแล้ว — สถานะปรับเป็น: รอออกตรวจ');
    }

    public function show($id)
    {
        $business = Business::with([
            'owner',
            'category',
            'licenses' => fn ($q) => $q->orderBy('expire_date', 'desc'),
            'inspectionRecords.round'
        ])->findOrFail($id);

        $rounds = \App\Models\InspectionRound::orderBy('inspection_date', 'desc')->get();

        return Inertia::render('Business/Show', [
            'business' => $business,
            'rounds' => $rounds,
        ]);
    }

    public function destroy($id)
    {
        $business = Business::findOrFail($id);
        $name = $business->shop_name ?: ('รหัส #' . $business->business_id);
        $business->delete();

        return redirect()->route('search.index')->with('success', "ลบข้อมูลสถานประกอบการ '{$name}' เรียบร้อยแล้ว");
    }

    public function destroyOwner($id)
    {
        $owner = Owner::with('businesses')->findOrFail($id);
        $name = $owner->owner_name;
        $count = $owner->businesses()->count();
        $owner->delete();

        return redirect()->route('search.index')->with('success', "ลบข้อมูลผู้ประกอบการ '{$name}' และสถานประกอบการในครอบครองทั้งหมด ({$count} แห่ง) เรียบร้อยแล้ว");
    }
}

