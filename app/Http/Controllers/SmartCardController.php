<?php

namespace App\Http\Controllers;

use App\Models\Owner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SmartCardController extends Controller
{
    /**
     * อ่านข้อมูลจริงจากชิปบัตรประจำตัวประชาชนไทยผ่านเครื่องอ่าน USB (PC/SC)
     */
    public function readCard(Request $request)
    {
        // ตรวจสอบว่าผู้ใช้สั่งบังคับ mock หรือไม่
        if ($request->query('mock') === '1') {
            return $this->mockCard();
        }

        $pythonPath = 'C:\\Python312\\python.exe';
        if (!file_exists($pythonPath)) {
            $pythonPath = 'python';
        }

        $scriptPath = base_path('scripts/read_card.py');
        $jsonFilePath = storage_path('app/card_read.json');

        // ลบไฟล์ผลลัพธ์เดิมออกก่อน (ถ้ามี)
        if (file_exists($jsonFilePath)) {
            @unlink($jsonFilePath);
        }

        $command = escapeshellcmd("{$pythonPath} \"{$scriptPath}\"");
        $output = [];
        $returnCode = 0;

        exec($command . ' 2>&1', $output, $returnCode);
        $outputStr = implode("\n", $output);

        $result = null;

        // 1. ตรวจสอบจาก Base64 Token (Pure ASCII, ไม่มีปัญหา Windows Codepage)
        if (preg_match('/CARD_DATA:([A-Za-z0-9+\/=\r\n]+)/', $outputStr, $matches)) {
            $decoded = base64_decode(trim($matches[1]));
            $result = json_decode($decoded, true);
        }

        // 2. ถ้าไม่มี token ให้ตรวจดูจากไฟล์ที่สคริปต์เขียนไว้โดยตรง
        if (!$result && file_exists($jsonFilePath)) {
            $fileContent = file_get_contents($jsonFilePath);
            $result = json_decode($fileContent, true);
        }

        // 3. ถ้าได้ผลลัพธ์เป็น Array
        if (is_array($result)) {
            if (!empty($result['success']) && !empty($result['data'])) {
                $card = $result['data'];

                // ตรวจสอบว่าเจ้าของบัตรนี้มีประวัติในฐานข้อมูลแล้วหรือไม่
                $existingOwner = Owner::with('businesses.licenses')
                    ->where('citizen_id', $card['citizen_id'])
                    ->first();

                return response()->json([
                    'success' => true,
                    'message' => 'อ่านข้อมูลจากชิปบัตรประชาชนจริงสำเร็จ',
                    'data' => $card,
                    'is_registered' => (bool)$existingOwner,
                    'existing_owner' => $existingOwner,
                ]);
            }

            // ถ้าเครื่องอ่านหรือบัตรแจ้ง Error (เช่น ยังไม่ได้เสียบบัตร)
            $errorMessage = $result['error'] ?? 'ไม่สามารถอ่านข้อมูลจากบัตรได้';
            return response()->json([
                'success' => false,
                'error' => $errorMessage,
            ], 422);
        }

        // กรณีฉุกเฉิน: แปลงข้อความให้เป็น UTF-8 ที่ปลอดภัยก่อนส่ง
        $safeOutput = mb_convert_encoding($outputStr, 'UTF-8', 'auto');
        Log::warning('SmartCard raw error: ' . $safeOutput);

        return response()->json([
            'success' => false,
            'error' => 'ไม่สามารถเชื่อมต่อกับไดรเวอร์เครื่องอ่านบัตรประชาชนได้ กรุณาตรวจสอบการเสียบสาย USB',
        ], 422);
    }

    /**
     * ดึงข้อมูลจำลอง (กรณีไม่มีเครื่องอ่านเชื่อมต่อสำหรับทดสอบ)
     */
    public function mockCard()
    {
        $firstOwner = Owner::with('businesses.licenses')->first();

        $card = [
            'citizen_id' => $firstOwner ? $firstOwner->citizen_id : '1570501313706',
            'title_name' => 'นาย',
            'first_name' => 'เอนก',
            'last_name' => 'วังศรี',
            'owner_name' => $firstOwner ? $firstOwner->owner_name : 'นายเอนก วังศรี',
            'birth_date' => '25180514',
            'gender' => 'ชาย',
            'office_address' => $firstOwner ? $firstOwner->office_address : '14',
            'moo' => $firstOwner ? $firstOwner->moo : '4',
            'subdistrict' => $firstOwner ? $firstOwner->subdistrict : 'ดอยงาม',
            'district' => $firstOwner ? $firstOwner->district : 'พาน',
            'province' => $firstOwner ? $firstOwner->province : 'เชียงราย',
            'phone' => $firstOwner ? $firstOwner->phone : '089-2369952',
            'reader_name' => 'จำลองระบบอ่านบัตร (Mock Reader)',
        ];

        return response()->json([
            'success' => true,
            'message' => 'จำลองการอ่านข้อมูลบัตรประชาชน',
            'data' => $card,
            'is_registered' => (bool)$firstOwner,
            'existing_owner' => $firstOwner,
        ]);
    }
}
