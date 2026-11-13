<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\BusinessCategory;
use App\Models\InspectionRecord;
use App\Models\InspectionRound;
use App\Models\License;
use App\Models\Owner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with REAL data from Excel.
     */
    public function run(): void
    {
        // 1. ปิด Foreign Key Checks ชั่วคราวเพื่อล้างข้อมูลเก่าออกทั้งหมด
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        InspectionRecord::truncate();
        InspectionRound::truncate();
        License::truncate();
        Business::truncate();
        Owner::truncate();
        BusinessCategory::truncate();
        User::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. สร้างบัญชีผู้ใช้งานระบบ (Admin / Staff Accounts)
        User::create([
            'username' => 'admin',
            'name' => 'ผู้ดูแลระบบ อบต.ดอยงาม',
            'email' => 'admin@doingam.go.th',
            'position' => 'หัวหน้าฝ่ายพัฒนารายได้และสาธารณสุข',
            'role' => 'admin',
            'status' => 'approved',
            'password' => Hash::make('admin'),
        ]);

        User::create([
            'username' => 'staff',
            'name' => 'นายธนภัทร พานพัฒนา',
            'email' => 'staff@doingam.go.th',
            'position' => 'นักวิชาการสาธารณสุขปฏิบัติการ',
            'role' => 'staff',
            'status' => 'approved',
            'password' => Hash::make('password'),
        ]);

        User::create([
            'username' => 'somchai',
            'name' => 'นายสมชาย มั่นคง',
            'email' => 'somchai@doingam.go.th',
            'position' => 'เจ้าพนักงานสาธารณสุขชุมชน',
            'role' => 'staff',
            'status' => 'pending',
            'password' => Hash::make('password'),
        ]);

        // 3. อ่านไฟล์ข้อมูลจริง real_data.json ที่แปลงมาจาก Excel รวมกิจการที่มีใบอนุญาต 2569 (2).xlsx
        $jsonPath = database_path('seeders/real_data.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("ไม่พบไฟล์ {$jsonPath}");
            return;
        }

        $realData = json_decode(file_get_contents($jsonPath), true);

        // 4. สร้างหมวดหมู่ประเภทกิจการหลัก (Categories)
        $categoriesMap = [];
        $categoriesList = ['ตลาด', 'สถานประกอบกิจการ', 'จำหน่าย/สะสมอาหาร'];
        foreach ($categoriesList as $catName) {
            $cat = BusinessCategory::create(['category_name' => $catName]);
            $categoriesMap[$catName] = $cat->category_id;
        }

        // 5. นำเข้าข้อมูลผู้ประกอบการจริง (Real Owners - 31 ราย)
        $ownersMap = [];
        foreach ($realData['owners'] as $ownerData) {
            $owner = Owner::create([
                'owner_name' => $ownerData['owner_name'],
                'citizen_id' => $ownerData['citizen_id'],
                'juristic_id' => $ownerData['juristic_id'],
                'phone' => $ownerData['phone'],
                'office_address' => $ownerData['office_address'],
                'moo' => $ownerData['moo'],
                'subdistrict' => $ownerData['subdistrict'] ?? 'ดอยงาม',
                'district' => $ownerData['district'] ?? 'พาน',
                'province' => $ownerData['province'] ?? 'เชียงราย',
            ]);
            $ownersMap[$ownerData['owner_name']] = $owner->owner_id;
        }

        // 6. นำเข้าข้อมูลสถานประกอบการจริง (Real Businesses - 38 แห่ง) & ใบอนุญาต (Licenses - 38 ใบ)
        $businessesMap = [];
        $today = Carbon::today();

        foreach ($realData['businesses'] as $bData) {
            $ownerId = $ownersMap[$bData['owner_name']] ?? null;
            $categoryId = $categoriesMap[$bData['category_name']] ?? $categoriesMap['สถานประกอบกิจการ'];

            if (!$ownerId) {
                continue;
            }

            $business = Business::create([
                'owner_id' => $ownerId,
                'category_id' => $categoryId,
                'shop_name' => $bData['shop_name'],
                'operation_type' => $bData['operation_type'],
                'shop_address' => $bData['shop_address'],
                'shop_moo' => $bData['shop_moo'],
                'shop_phone' => $bData['shop_phone'],
                'business_area' => $bData['business_area'],
                'machine_power' => $bData['machine_power'],
                'worker_count' => $bData['worker_count'],
            ]);

            $businessesMap[$bData['row_no']] = $business;

            // คำนวณสถานะใบอนุญาตจากวันสิ้นอายุจริง
            $expireDate = $bData['expire_date'] ? Carbon::parse($bData['expire_date']) : null;
            $status = 'active';
            if ($expireDate && $expireDate->lt($today)) {
                $status = 'expired';
            }

            License::create([
                'business_id' => $business->business_id,
                'fee' => $bData['fee'] ?? 0.00,
                'receipt_book' => $bData['receipt_book'],
                'receipt_no' => $bData['receipt_no'],
                'receipt_date' => $bData['receipt_date'],
                'expire_date' => $bData['expire_date'],
                'status' => $status,
            ]);
        }

        // 7. นำเข้ารอบการตรวจจริง (Real Inspection Rounds - 3 รอบ) และบันทึกผลการตรวจ (Inspection Records)
        foreach ($realData['rounds'] as $roundData) {
            $round = InspectionRound::create([
                'round_name' => $roundData['round_name'],
                'inspection_date' => $roundData['inspection_date'],
            ]);

            // หาและเชื่อมโยงสถานประกอบการที่ได้รับการตรวจในรอบนี้
            $inspectedOwners = array_unique($roundData['inspected_owners'] ?? []);

            foreach ($inspectedOwners as $inspectedOwnerName) {
                // ค้นหาธุรกิจของเจ้าของรายนี้
                $ownerId = $ownersMap[$inspectedOwnerName] ?? null;
                if (!$ownerId) {
                    continue;
                }

                $ownerBusinesses = Business::where('owner_id', $ownerId)->get();

                foreach ($ownerBusinesses as $biz) {
                    // ป้องกันการบันทึกซ้ำในรอบเดียวกัน
                    $exists = InspectionRecord::where('round_id', $round->round_id)
                        ->where('business_id', $biz->business_id)
                        ->exists();

                    if (!$exists) {
                        InspectionRecord::create([
                            'round_id' => $round->round_id,
                            'business_id' => $biz->business_id,
                            'condition_4_3' => 'ปฏิบัติตามมาตรฐานสุขอนามัยและระเบียบกระทรวงสาธารณสุขโดยเคร่งครัด',
                            'condition_4_4' => 'ดูแลรักษาความสะอาด ความปลอดภัย และไม่สร้างความเดือดร้อนรำคาญแก่ชุมชน',
                            'notes' => 'ตรวจแล้ว ผ่านเกณฑ์มาตรฐานสุขลักษณะ',
                            'file_url' => null,
                        ]);
                    }
                }
            }
        }
    }
}
