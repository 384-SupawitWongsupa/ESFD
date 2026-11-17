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

    public function preview(Request $request, $businessId)
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

        $shopName = $business->shop_name;
        $opType = $business->operation_type ?: ($business->category->category_name ?? '');
        $businessOperation = $shopName && $opType 
            ? "{$shopName} ({$opType})" 
            : ($shopName ?: $opType);

        $issueD = $latestLicense && $latestLicense->receipt_date 
            ? Carbon::parse($latestLicense->receipt_date) 
            : now();
        $expireD = $latestLicense && $latestLicense->expire_date 
            ? Carbon::parse($latestLicense->expire_date) 
            : now()->addYear();

        $cond3 = ($latestInspection && $latestInspection->condition_4_3 && $latestInspection->condition_4_3 !== 'ไม่มี')
            ? $latestInspection->condition_4_3 
            : '';
        $cond4 = ($latestInspection && $latestInspection->condition_4_4 && $latestInspection->condition_4_4 !== 'ไม่มี')
            ? $latestInspection->condition_4_4 
            : '';

        $aph2Data = [
            'receipt_book' => '', // เว้นว่างไว้ตามที่ผู้ใช้ร้องขอ เพื่อให้เจ้าหน้าที่กรอกเอง
            'receipt_no' => $latestLicense->receipt_no ?? '',
            'license_year' => (string)($expireD->year + 543),
            'owner_name' => $business->owner->owner_name ?? '',
            'nationality' => 'ไทย',
            'office_address' => $business->owner->office_address ?: $business->shop_address ?: '',
            'moo' => $business->owner->moo ?: $business->shop_moo ?: '',
            'subdistrict' => $business->owner->subdistrict ?: 'ดอยงาม',
            'district' => $business->owner->district ?: 'พาน',
            'province' => $business->owner->province ?: 'เชียงราย',
            'id_card_or_juristic' => $business->owner->citizen_id ?: $business->owner->juristic_id ?: '',
            'phone' => $business->owner->phone ?: '',
            'shop_name' => $business->shop_name ?: '',
            'operation_type' => $business->operation_type ?: ($business->category->category_name ?? ''),
            'shop_address' => $business->shop_address ?: '',
            'shop_moo' => $business->shop_moo ?: '',
            'shop_subdistrict' => 'ดอยงาม',
            'shop_district' => 'พาน',
            'shop_province' => 'เชียงราย',
            'shop_phone' => $business->shop_phone ?: $business->owner->phone ?: '',
            'fee' => $latestLicense ? (string)$latestLicense->fee : '0',
            'fee_text' => $latestLicense && $latestLicense->fee ? DocumentService::bahtText($latestLicense->fee) : '',
            'receipt_info' => $latestLicense->receipt_book ?? '',
            'receipt_date' => $latestLicense && $latestLicense->receipt_date 
                ? DocumentService::thaiDate($latestLicense->receipt_date) 
                : DocumentService::thaiDate(now()),
            'condition_4_3' => $cond3,
            'condition_4_4' => $cond4,
            'issue_day' => (string)$issueD->day,
            'issue_month' => $thaiMonths[$issueD->month],
            'issue_year' => (string)($issueD->year + 543),
            'expire_day' => (string)$expireD->day,
            'expire_month' => $thaiMonths[$expireD->month],
            'expire_year' => (string)($expireD->year + 543),
        ];

        return Inertia::render('Document/Preview', [
            'business' => $business,
            'owner' => $business->owner,
            'license' => $latestLicense,
            'inspection' => $latestInspection,
            'templateData' => [
                'business_operation' => $businessOperation,
                'written_at' => 'อบต.ดอยงาม',
                'date_day' => (string)$d->day,
                'date_month' => $thaiMonths[$d->month],
                'date_year' => (string)($d->year + 543),
                'applicant_name' => $business->owner->owner_name ?? '',
                'age' => '',
                'nationality' => 'ไทย',
                'juristic_rep' => !empty($business->owner->juristic_id) ? ($business->owner->owner_name ?? '') : '',
                'address_no' => $business->owner->office_address ?: $business->shop_address ?: '-',
                'address_moo' => $business->owner->moo ?: $business->shop_moo ?: '-',
                'address_soi' => '-',
                'address_road' => '-',
                'address_subdistrict' => $business->owner->subdistrict ?: 'ดอยงาม',
                'address_district' => $business->owner->district ?: 'พาน',
                'address_province' => $business->owner->province ?: 'เชียงราย',
                'phone' => $business->owner->phone ?: '',
                'is_juristic' => !empty($business->owner->juristic_id),
                'request_no' => $business->request_no ?: '',
            ],
            'aph2Data' => $aph2Data,
            'thaiIssueDate' => $latestLicense && $latestLicense->receipt_date 
                ? DocumentService::thaiDate($latestLicense->receipt_date) 
                : DocumentService::thaiDate(now()),
            'thaiExpireDate' => $latestLicense && $latestLicense->expire_date 
                ? DocumentService::thaiDate($latestLicense->expire_date) 
                : DocumentService::thaiDate(now()->addYear()),
            'initialTab' => $request->query('tab', 'interactive_form'),
            'initialForm' => $request->query('form', 'aph1'),
        ]);
    }

    public function appTemplatePdf(Request $request, $businessId)
    {
        $business = Business::with(['owner', 'category'])->findOrFail($businessId);

        // Allow frontend edits to override defaults via query params
        $overrides = [];
        $allowed = [
            'operation', 'date_day', 'date_month', 'date_year',
            'applicant_name', 'age', 'nationality', 'juristic_rep',
            'address_no', 'address_moo', 'address_soi', 'address_road',
            'address_subdistrict', 'address_district', 'address_province',
            'phone', 'is_juristic', 'request_no',
            'chk_1', 'chk_2', 'chk_3', 'chk_4', 'chk_5', 'chk_6', 'chk_7',
        ];
        foreach ($allowed as $key) {
            if ($request->has($key)) {
                $value = $request->input($key);
                // map query param names to data keys used by DocumentService
                $map = ['operation' => 'business_operation'];
                $dataKey = $map[$key] ?? $key;

                if (in_array($key, ['is_juristic', 'chk_1', 'chk_2', 'chk_3', 'chk_4', 'chk_5', 'chk_6', 'chk_7'])) {
                    $overrides[$dataKey] = (bool)(int)$value;
                } else {
                    $overrides[$dataKey] = $value;
                }
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

    public function aph2Pdf(Request $request, $businessId)
    {
        $business = Business::with(['owner', 'category', 'licenses', 'inspectionRecords'])->findOrFail($businessId);

        $overrides = [];
        $allowed = [
            'receipt_book', 'receipt_no', 'license_year',
            'owner_name', 'nationality', 'office_address', 'moo', 'subdistrict', 'district', 'province',
            'id_card_or_juristic', 'phone', 'shop_name', 'operation_type',
            'shop_address', 'shop_moo', 'shop_subdistrict', 'shop_district', 'shop_province', 'shop_phone',
            'fee', 'fee_text', 'receipt_info', 'receipt_date',
            'condition_4_3', 'condition_4_4',
            'issue_day', 'issue_month', 'issue_year',
            'expire_day', 'expire_month', 'expire_year'
        ];
        foreach ($allowed as $k) {
            if ($request->has($k)) {
                $overrides[$k] = $request->input($k);
            }
        }

        $filePath = $this->docService->generateAph2Pdf($business, $overrides);

        $cleanName = preg_replace('/[^a-zA-Z0-9_\x{0E00}-\x{0E7F}]/u', '_', $business->shop_name ?: $business->business_id);
        $filename = 'แบบ_อภ๒_' . $cleanName . '.pdf';
        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ])->deleteFileAfterSend(true);
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
                $pdfPath = $this->docService->generateAph2Pdf($business);
                $name = ($idx + 1) . '_แบบ_อภ๒_' . ($business->shop_name ?: $business->business_id) . '.pdf';
                $zip->addFile($pdfPath, $name);

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

            $message = 'พิมพ์ใบอนุญาตประกอบกิจการ (แบบ อภ.๒) เรียบร้อยแล้ว — รายชื่อถูกย้ายไปที่สถานะพิมพ์ใบอนุญาตแล้ว';

            if ($request->input('from') === 'pending-print') {
                return redirect()->route('pending-print.index', ['status' => 'completed'])
                    ->with('success', $message);
            }
            if ($request->input('from') === 'expirations') {
                return redirect()->route('expirations.index')
                    ->with('success', $message);
            }
        } else {
            if ($business->workflow_status === 'pending_request') {
                $business->update([
                    'workflow_status' => 'pending_inspection',
                    'inspection_status' => 'pending',
                ]);
            }
            $message = 'พิมพ์แบบคำขอรับใบอนุญาต (แบบ อภ.๑) เรียบร้อยแล้ว';

            if ($request->input('from') === 'pending-print') {
                return redirect()->route('pending-print.index', ['status' => 'pending_inspection'])
                    ->with('success', $message);
            }
            if ($request->input('from') === 'expirations') {
                return redirect()->route('expirations.index')
                    ->with('success', $message);
            }
        }

        if ($request->input('from') === 'expirations') {
            return redirect()->route('expirations.index')
                ->with('success', $message);
        }

        return redirect()->route('businesses.show', ['id' => $businessId])
            ->with('success', $message);
    }
}

