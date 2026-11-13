<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\License;
use App\Models\Owner;
use App\Services\DocumentService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use ZipArchive;

class DocumentController extends Controller
{
    protected DocumentService $docService;

    public function __construct(DocumentService $docService)
    {
        $this->docService = $docService;
    }

    public function preview($businessId)
    {
        $business = Business::with([
            'owner',
            'category',
            'licenses' => fn ($q) => $q->latest('expire_date'),
            'inspectionRecords' => fn ($q) => $q->with('round')->latest(),
        ])->findOrFail($businessId);

        $latestLicense = $business->licenses->first();
        $latestInspection = $business->inspectionRecords->first();

        $d = $latestLicense && $latestLicense->receipt_date 
            ? Carbon::parse($latestLicense->receipt_date) 
            : now();

        $thaiMonths = [
            1 => 'มกราคม', 2 => 'กุมภาพันธ์', 3 => 'มีนาคม', 4 => 'เมษายน',
            5 => 'พฤษภาคม', 6 => 'มิถุนายน', 7 => 'กรกฎาคม', 8 => 'สิงหาคม',
            9 => 'กันยายน', 10 => 'ตุลาคม', 11 => 'พฤศจิกายน', 12 => 'ธันวาคม'
        ];

        return Inertia::render('Document/Preview', [
            'business' => $business,
            'owner' => $business->owner,
            'license' => $latestLicense,
            'inspection' => $latestInspection,
            'templateData' => [
                'business_operation' => $business->operation_type ?: ($business->category->category_name ?? ''),
                'written_at' => 'อบต.ดอยงาม',
                'date_day' => (string)$d->day,
                'date_month' => $thaiMonths[$d->month],
                'date_year' => (string)($d->year + 543),
                'applicant_name' => $business->owner->owner_name ?? '',
                'nationality' => 'ไทย',
                'address_no' => $business->owner->office_address ?: $business->shop_address ?: '-',
                'address_moo' => $business->owner->moo ?: $business->shop_moo ?: '-',
                'address_soi' => '-',
                'address_road' => '-',
                'address_subdistrict' => $business->owner->subdistrict ?: 'ดอยงาม',
                'address_district' => $business->owner->district ?: 'พาน',
                'address_province' => $business->owner->province ?: 'เชียงราย',
                'phone' => $business->owner->phone ?: '',
                'is_juristic' => !empty($business->owner->juristic_id),
            ],
            'thaiIssueDate' => $latestLicense && $latestLicense->receipt_date 
                ? DocumentService::thaiDate($latestLicense->receipt_date) 
                : DocumentService::thaiDate(now()),
            'thaiExpireDate' => $latestLicense && $latestLicense->expire_date 
                ? DocumentService::thaiDate($latestLicense->expire_date) 
                : DocumentService::thaiDate(now()->addYear()),
        ]);
    }

    public function appTemplatePdf(Request $request, $businessId)
    {
        $business = Business::with(['owner', 'category'])->findOrFail($businessId);

        // Allow frontend edits to override defaults via query params
        $overrides = [];
        $allowed = [
            'operation', 'date_day', 'date_month', 'date_year',
            'applicant_name', 'age', 'nationality',
            'address_no', 'address_moo', 'address_soi', 'address_road',
            'address_subdistrict', 'address_district', 'address_province',
            'phone', 'is_juristic', 'request_no',
        ];
        foreach ($allowed as $key) {
            if ($request->has($key)) {
                $value = $request->input($key);
                // map query param names to data keys used by DocumentService
                $map = ['operation' => 'business_operation'];
                $dataKey = $map[$key] ?? $key;
                $overrides[$dataKey] = $key === 'is_juristic' ? (bool)(int)$value : $value;
            }
        }

        $filePath = $this->docService->generateAppTemplatePdf($business, $overrides);

        $cleanName = preg_replace('/[^a-zA-Z0-9_\x{0E00}-\x{0E7F}]/u', '_', $business->owner->owner_name ?? $business->business_id);
        $filename = 'แบบคำขอ_' . $cleanName . '.pdf';
        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ])->deleteFileAfterSend(true);
    }

    public function aph2Pdf($businessId)
    {
        $business = Business::findOrFail($businessId);
        $pdf = $this->docService->generateAph2Pdf($business);

        $filename = 'APH2_' . ($business->shop_name ?: $business->business_id) . '.pdf';
        return $pdf->stream($filename);
    }

    public function aph2Word($businessId)
    {
        $business = Business::findOrFail($businessId);
        $filePath = $this->docService->generateAph2Docx($business);

        $filename = 'APH2_' . ($business->shop_name ?: $business->business_id) . '.docx';
        return response()->download($filePath, $filename)->deleteFileAfterSend(true);
    }

    public function sth2Pdf(Request $request, $businessId)
    {
        return $this->appTemplatePdf($request, $businessId);
    }

    public function batchZip($ownerId)
    {
        $owner = Owner::with('businesses.licenses')->findOrFail($ownerId);
        
        $zipFileName = 'Licenses_' . preg_replace('/[^a-zA-Z0-9_\x{0E00}-\x{0E7F}]/u', '_', $owner->owner_name) . '.zip';
        $zipPath = tempnam(sys_get_temp_dir(), 'zip_');

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($owner->businesses as $idx => $business) {
                // สร้าง PDF อภ.๒
                $pdf = $this->docService->generateAph2Pdf($business);
                $pdfContent = $pdf->output();
                $name = ($idx + 1) . '_แบบ_อภ๒_' . ($business->shop_name ?: $business->business_id) . '.pdf';
                $zip->addFromString($name, $pdfContent);

                // สร้าง PDF แบบคำขอ (app_template)
                $pdfSthPath = $this->docService->generateAppTemplatePdf($business);
                $nameSth = ($idx + 1) . '_แบบคำขอ_' . ($business->shop_name ?: $business->business_id) . '.pdf';
                $zip->addFile($pdfSthPath, $nameSth);
            }
            $zip->close();
        }

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    public function afterPrint(Request $request, $businessId)
    {
        $business = Business::findOrFail($businessId);
        $docType = $request->input('doc_type', 'app_template');

        if ($docType === 'aph2') {
            License::where('business_id', $businessId)
                ->where('status', 'active')
                ->latest('expire_date')
                ->update([
                    'is_printed' => true,
                    'printed_at' => now(),
                ]);

            // อัปเดตสถานะขั้นตอนเป็นเสร็จสิ้น (completed)
            $business->update([
                'workflow_status' => 'completed',
            ]);

            $message = 'พิมพ์ใบอนุญาตประกอบกิจการ (แบบ อภ.๒) เรียบร้อยแล้ว';
        } else {
            $message = 'พิมพ์แบบคำขอรับใบอนุญาต (แบบ สธ.๒) เรียบร้อยแล้ว';
        }

        return redirect()->route('businesses.show', ['id' => $businessId])
            ->with('success', $message);
    }
}

