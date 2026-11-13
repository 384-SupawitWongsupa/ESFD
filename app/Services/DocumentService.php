<?php

namespace App\Services;

use App\Models\Business;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use Carbon\Carbon;

class DocumentService
{
    /**
     * แปลงปี ค.ศ. เป็น พ.ศ.
     */
    public static function thaiDate($date): string
    {
        if (!$date) return '-';
        $d = Carbon::parse($date);
        $thaiMonths = [
            1 => 'มกราคม', 2 => 'กุมภาพันธ์', 3 => 'มีนาคม', 4 => 'เมษายน',
            5 => 'พฤษภาคม', 6 => 'มิถุนายน', 7 => 'กรกฎาคม', 8 => 'สิงหาคม',
            9 => 'กันยายน', 10 => 'ตุลาคม', 11 => 'พฤศจิกายน', 12 => 'ธันวาคม'
        ];
        $buddhistYear = $d->year + 543;
        return $d->day . ' ' . $thaiMonths[$d->month] . ' ' . $buddhistYear;
    }

    /**
     * สร้าง PDF ใบอนุญาต อภ.๒
     */
    public function generateAph2Pdf(Business $business)
    {
        $business->load(['owner', 'category', 'licenses' => function ($q) {
            $q->latest('expire_date');
        }, 'inspectionRecords' => function ($q) {
            $q->latest('created_at');
        }]);

        $latestLicense = $business->licenses->first();
        $latestInspection = $business->inspectionRecords->first();

        $data = [
            'business' => $business,
            'owner' => $business->owner,
            'license' => $latestLicense,
            'inspection' => $latestInspection,
            'issueDate' => $latestLicense && $latestLicense->receipt_date 
                ? self::thaiDate($latestLicense->receipt_date) 
                : self::thaiDate(now()),
            'expireDate' => $latestLicense && $latestLicense->expire_date 
                ? self::thaiDate($latestLicense->expire_date) 
                : self::thaiDate(now()->addYear()),
        ];

        $html = view('documents.aph2', $data)->render();
        $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        return $pdf;
    }

    /**
     * สร้าง Word .docx แบบ อภ.๒
     */
    public function generateAph2Docx(Business $business): string
    {
        $business->load(['owner', 'category', 'licenses', 'inspectionRecords']);
        $latestLicense = $business->licenses->sortByDesc('expire_date')->first();
        $latestInspection = $business->inspectionRecords->sortByDesc('created_at')->first();

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('TH Sarabun New');
        $phpWord->setDefaultFontSize(16);

        $section = $phpWord->addSection([
            'marginTop' => 1200,
            'marginBottom' => 1200,
            'marginLeft' => 1200,
            'marginRight' => 1200,
        ]);

        // ส่วนหัวเอกสาร
        $section->addText('แบบ อภ. ๒', ['bold' => true, 'size' => 14], ['alignment' => Jc::RIGHT]);
        $section->addText('ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ', ['bold' => true, 'size' => 18], ['alignment' => Jc::CENTER]);
        $section->addText('องค์การบริหารส่วนตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย', ['bold' => true, 'size' => 16], ['alignment' => Jc::CENTER]);
        $section->addTextBreak(1);

        $section->addText('เล่มที่: ' . ($latestLicense->receipt_book ?? '-') . '   เลขที่: ' . ($latestLicense->receipt_no ?? '-'), ['size' => 16]);
        $section->addText('ใบอนุญาตฉบับนี้ออกให้แก่: ' . ($business->owner->owner_name ?? '-'), ['bold' => true, 'size' => 16]);
        $section->addText('เลขประจำตัวประชาชน / นิติบุคคล: ' . ($business->owner->citizen_id ?? $business->owner->juristic_id ?? '-'));
        $section->addText('อยู่บ้านเลขที่ / สำนักงานเลขที่: ' . ($business->owner->office_address ?? '-') . ' หมู่ที่: ' . ($business->owner->moo ?? '-') . ' ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย');
        $section->addText('ชื่อสถานประกอบการ: ' . ($business->shop_name ?: 'ไม่มีชื่อทางการค้า') . ' ประเภทกิจการ: ' . ($business->operation_type ?? '-'));
        $section->addText('ตั้งอยู่เลขที่: ' . ($business->shop_address ?? '-') . ' หมู่ที่: ' . ($business->shop_moo ?? '-') . ' ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย');
        $section->addText('พื้นที่ประกอบการ: ' . ($business->business_area ?? '-') . ' กำลังเครื่องจักร: ' . ($business->machine_power ?? '-') . ' จำนวนคนงาน: ' . ($business->worker_count ?? '-'));

        $section->addTextBreak(1);
        $section->addText('เงื่อนไขเฉพาะการประกอบกิจการ:', ['bold' => true, 'underline' => 'single']);
        
        $cond4_3 = $latestInspection->condition_4_3 ?? 'ไม่มี';
        $cond4_4 = $latestInspection->condition_4_4 ?? 'ไม่มี';
        
        $section->addText('ข้อ ๔.๓: ' . $cond4_3);
        $section->addText('ข้อ ๔.๔: ' . $cond4_4);

        $section->addTextBreak(1);
        $expDateStr = $latestLicense && $latestLicense->expire_date ? self::thaiDate($latestLicense->expire_date) : '-';
        $section->addText('ใบอนุญาตนี้สิ้นอายุในวันที่: ' . $expDateStr, ['bold' => true]);
        $section->addText('ค่าธรรมเนียม: ' . number_format($latestLicense->fee ?? 0, 2) . ' บาท');

        $section->addTextBreak(2);
        $section->addText('(ลงชื่อ).................................................................', null, ['alignment' => Jc::RIGHT]);
        $section->addText('(นายกองค์การบริหารส่วนตำบลดอยงาม)', null, ['alignment' => Jc::RIGHT]);

        $tempFile = tempnam(sys_get_temp_dir(), 'aph2_') . '.docx';
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return $tempFile;
    }

    /**
     * สร้าง PDF แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต อ้างอิงตามแบบฟอร์ม app_template.pdf
     * @param array $overrides  ข้อมูลที่ผู้ใช้แก้ไขจากหน้า preview (override default)
     */
    public function generateAppTemplatePdf(Business $business, array $overrides = []): string
    {
        $business->load(['owner', 'category', 'licenses']);
        $latestLicense = $business->licenses->sortByDesc('expire_date')->first();

        $d = $latestLicense && $latestLicense->receipt_date 
            ? Carbon::parse($latestLicense->receipt_date) 
            : now();

        $thaiMonths = [
            1 => 'มกราคม', 2 => 'กุมภาพันธ์', 3 => 'มีนาคม', 4 => 'เมษายน',
            5 => 'พฤษภาคม', 6 => 'มิถุนายน', 7 => 'กรกฎาคม', 8 => 'สิงหาคม',
            9 => 'กันยายน', 10 => 'ตุลาคม', 11 => 'พฤศจิกายน', 12 => 'ธันวาคม'
        ];

        $templatePath = storage_path('app/templates/app_template.pdf');
        $outputPath = tempnam(sys_get_temp_dir(), 'app_pdf_') . '.pdf';
        $cfgPath = tempnam(sys_get_temp_dir(), 'app_cfg_') . '.json';

        // Default data from DB
        $data = [
            'business_operation' => $business->operation_type ?: ($business->category->category_name ?? ''),
            'written_at' => 'อบต.ดอยงาม',
            'date_day'   => (string)$d->day,
            'date_month' => $thaiMonths[$d->month],
            'date_year'  => (string)($d->year + 543),
            'applicant_name'      => $business->owner->owner_name ?? '',
            'nationality'         => 'ไทย',
            'address_no'          => $business->owner->office_address ?: $business->shop_address ?: '-',
            'address_moo'         => $business->owner->moo ?: $business->shop_moo ?: '-',
            'address_soi'         => '-',
            'address_road'        => '-',
            'address_subdistrict' => $business->owner->subdistrict ?: 'ดอยงาม',
            'address_district'    => $business->owner->district    ?: 'พาน',
            'address_province'    => $business->owner->province    ?: 'เชียงราย',
            'phone'               => $business->owner->phone ?: '',
            'is_juristic'         => !empty($business->owner->juristic_id),
        ];

        // Apply user overrides from the editable preview form
        foreach ($overrides as $key => $value) {
            if (array_key_exists($key, $data)) {
                $data[$key] = $value;
            }
        }

        file_put_contents($cfgPath, json_encode([
            'template_path' => $templatePath,
            'output_path' => $outputPath,
            'data' => $data,
        ], JSON_UNESCAPED_UNICODE));

        $scriptPath = base_path('scripts/generate_app_pdf.py');
        $pythonExe = 'C:\\Python312\\python.exe';
        $userSitePackages = 'C:\\Users\\bosss\\AppData\\Roaming\\Python\\Python312\\site-packages';
        $process = new \Symfony\Component\Process\Process([$pythonExe, $scriptPath, $cfgPath]);
        $process->setEnv([
            'PYTHONPATH' => $userSitePackages,
            'PATH'       => getenv('PATH') ?: '',
        ]);
        $process->setTimeout(60);
        $process->run();

        if (file_exists($cfgPath)) {
            @unlink($cfgPath);
        }

        if (!$process->isSuccessful() || !file_exists($outputPath)) {
            throw new \RuntimeException('Failed to generate PDF: ' . $process->getErrorOutput());
        }

        return $outputPath;
    }

    /**
     * สร้าง PDF แบบคำขอ สธ.๒ (ใช้ template ทางการ)
     */
    public function generateSth2Pdf(Business $business)
    {
        return $this->generateAppTemplatePdf($business);
    }
}

