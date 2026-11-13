<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessCategory;
use App\Models\InspectionRound;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpirationController extends Controller
{
    public function index(Request $request)
    {
        $today    = Carbon::today();
        $in90Days = Carbon::today()->addDays(90);

        $tab      = $request->query('tab', 'expired'); // 'expired' | 'expiring' | 'active'
        $category = $request->query('category', 'all');
        $moo      = $request->query('moo', 'all');
        $keyword  = trim($request->query('q', ''));

        // ─── base query ───────────────────────────────────────────────
        $query = Business::with([
            'owner',
            'category',
            'licenses'          => fn ($q) => $q->latest('expire_date'),
            'latestLicense',
            'inspectionRecords' => fn ($q) => $q->with('round')->latest(),
        ]);

        // ─── กรองตามแท็บ (ใช้ latestLicense เท่านั้น) ────────────────
        $this->applyTabFilter($query, $tab, $today, $in90Days);

        // ─── กรองเพิ่มเติม ────────────────────────────────────────────
        if ($category !== 'all') {
            $query->where('category_id', $category);
        }

        if ($moo !== 'all') {
            $query->where(function ($q) use ($moo) {
                $q->where('shop_moo', $moo)
                  ->orWhereHas('owner', fn ($oq) => $oq->where('moo', $moo));
            });
        }

        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('shop_name', 'like', "%{$keyword}%")
                  ->orWhere('operation_type', 'like', "%{$keyword}%")
                  ->orWhereHas('owner', fn ($oq) =>
                      $oq->where('owner_name', 'like', "%{$keyword}%")
                         ->orWhere('citizen_id',  'like', "%{$keyword}%")
                         ->orWhere('phone',        'like', "%{$keyword}%")
                  );
            });
        }

        $businesses = $query->paginate(20)->withQueryString();

        // ─── นับจำนวนแต่ละแท็บ ───────────────────────────────────────
        $counts = [
            'expired'  => $this->buildCount('expired',  $today, $in90Days),
            'expiring' => $this->buildCount('expiring', $today, $in90Days),
            'active'   => $this->buildCount('active',   $today, $in90Days),
        ];

        $categories = BusinessCategory::all();
        $rounds     = InspectionRound::orderBy('inspection_date', 'desc')->get();

        return Inertia::render('Expiration/Index', [
            'businesses' => $businesses,
            'tab'        => $tab,
            'category'   => $category,
            'moo'        => $moo,
            'q'          => $keyword,
            'counts'     => $counts,
            'categories' => $categories,
            'rounds'     => $rounds,
        ]);
    }

    // ─── helpers ──────────────────────────────────────────────────────

    /**
     * ใส่ condition กรองตามแท็บบน latestLicense (ใบล่าสุดของแต่ละธุรกิจ)
     */
    private function applyTabFilter($query, string $tab, Carbon $today, Carbon $in90Days): void
    {
        match ($tab) {
            'expired'  => $query->whereHas('latestLicense', fn ($q) =>
                              $q->where(fn ($sq) =>
                                  $sq->where('expire_date', '<', $today)
                                     ->orWhere('status', 'expired')
                              )
                          ),

            'expiring' => $query->whereHas('latestLicense', fn ($q) =>
                              $q->where('expire_date', '>=', $today)
                               ->where('expire_date', '<=', $in90Days)
                               ->whereNotIn('status', ['expired'])
                          ),

            'active'   => $query->whereHas('latestLicense', fn ($q) =>
                              $q->where('expire_date', '>', $in90Days)
                               ->whereNotIn('status', ['expired'])
                          ),

            default    => null, // 'all' — ไม่กรอง
        };
    }

    private function buildCount(string $tab, Carbon $today, Carbon $in90Days): int
    {
        $q = Business::query();
        $this->applyTabFilter($q, $tab, $today, $in90Days);
        return $q->count();
    }

    // ─── Export CSV ───────────────────────────────────────────────────

    public function exportExcel(Request $request)
    {
        $today    = Carbon::today();
        $in90Days = Carbon::today()->addDays(90);
        $tab      = $request->query('tab', 'expired');

        $query = Business::with([
            'owner',
            'category',
            'latestLicense',
        ]);

        $this->applyTabFilter($query, $tab, $today, $in90Days);

        $items = $query->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="doingam_expiration_' . date('Ymd_His') . '.csv"',
        ];

        $callback = function () use ($items, $today) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF"); // BOM for Excel

            fputcsv($file, [
                'ลำดับ', 'ชื่อผู้ประกอบการ', 'เลขบัตรประชาชน/นิติบุคคล',
                'เบอร์โทรศัพท์', 'ที่อยู่ผู้ประกอบการ', 'ชื่อร้าน/สถานประกอบการ',
                'ประเภทกิจการ', 'ที่ตั้งร้าน', 'เล่มที่/เลขที่ใบเสร็จ',
                'วันหมดอายุ', 'สถานะ',
            ]);

            foreach ($items as $idx => $b) {
                $lic = $b->latestLicense;
                $expireDate = $lic && $lic->expire_date ? Carbon::parse($lic->expire_date) : null;

                if (!$expireDate) {
                    $statusText = '-';
                } elseif ($expireDate->lt($today)) {
                    $statusText = 'หมดอายุแล้ว';
                } elseif ($expireDate->lte($today->copy()->addDays(90))) {
                    $statusText = 'ใกล้หมดอายุ';
                } else {
                    $statusText = 'ปกติ';
                }

                fputcsv($file, [
                    $idx + 1,
                    $b->owner->owner_name ?? '-',
                    $b->owner->citizen_id ?? $b->owner->juristic_id ?? '-',
                    $b->owner->phone ?? '-',
                    ($b->owner->office_address ?? '-') . ' ม.' . ($b->owner->moo ?? '-') . ' ต.ดอยงาม อ.พาน',
                    $b->shop_name ?: 'ไม่มีชื่อทางการค้า',
                    $b->operation_type,
                    ($b->shop_address ?? '-') . ' ม.' . ($b->shop_moo ?? '-'),
                    ($lic->receipt_book ?? '-') . '/' . ($lic->receipt_no ?? '-'),
                    $expireDate ? $expireDate->format('d/m/Y') : '-',
                    $statusText,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
