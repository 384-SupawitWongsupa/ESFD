<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessCategory;
use App\Models\InspectionRecord;
use App\Models\InspectionRound;
use App\Models\License;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $in90Days = Carbon::today()->addDays(90);

        $selectedRound = $request->query('round', 'all');
        $selectedCategory = $request->query('category', 'all');

        // Query หลักของสถานประกอบการ
        $query = Business::with(['owner', 'category', 'licenses' => function ($q) {
            $q->latest('expire_date');
        }, 'inspectionRecords.round']);

        if ($selectedCategory !== 'all') {
            $query->where('category_id', $selectedCategory);
        }

        if ($selectedRound !== 'all') {
            $query->whereHas('inspectionRecords', function ($q) use ($selectedRound) {
                $q->where('round_id', $selectedRound);
            });
        }

        $allBusinesses = $query->get();

        // คำนวณสถิติ — นับจากใบอนุญาตล่าสุดของแต่ละธุรกิจเท่านั้น
        $totalBusinesses = Business::count();
        $totalOwners = \App\Models\Owner::count();

        // ใบอนุญาตที่หมดอายุแล้ว (ใบล่าสุดเท่านั้น)
        $expiredCount = Business::whereHas('latestLicense', fn ($q) =>
            $q->where(fn ($sq) => $sq->where('expire_date', '<', $today)->orWhere('status', 'expired'))
        )->count();

        // ใกล้หมดอายุ ภายใน 90 วัน (ใบล่าสุด)
        $expiringCount = Business::whereHas('latestLicense', fn ($q) =>
            $q->where('expire_date', '>=', $today)
              ->where('expire_date', '<=', $in90Days)
              ->whereNotIn('status', ['expired'])
        )->count();

        // ปกติ > 90 วัน (ใบล่าสุด)
        $activeCount = Business::whereHas('latestLicense', fn ($q) =>
            $q->where('expire_date', '>', $in90Days)
              ->whereNotIn('status', ['expired'])
        )->count();

        // 4 Stages Totals (Workflow)
        $pendingRequestCount = Business::where('workflow_status', 'pending_request')->count();
        $pendingInspectionCount = Business::where('workflow_status', 'pending_inspection')->count();
        $pendingPrintCount = Business::where('workflow_status', 'pending_print')->count();
        $completedCount = Business::where('workflow_status', 'completed')->count();

        // Fallback หากข้อมูลยังไม่มีการระบุ ให้กระจายตามข้อมูลสถานะจริง
        if ($pendingRequestCount + $pendingInspectionCount + $pendingPrintCount + $completedCount === 0 && $totalBusinesses > 0) {
            $completedCount = $activeCount;
            $pendingPrintCount = License::where('is_printed', false)->count();
            $pendingInspectionCount = Business::where('inspection_status', 'uninspected')->count();
            $pendingRequestCount = max(0, $totalBusinesses - ($completedCount + $pendingPrintCount + $pendingInspectionCount));
        }

        $stageTotals = [
            'total' => $totalBusinesses,
            'pending_request' => $pendingRequestCount,
            'pending_inspection' => $pendingInspectionCount,
            'pending_print' => $pendingPrintCount,
            'completed' => $completedCount,
        ];

        // สถิติแยกตามหมวดหมู่แบบละเอียด (สำหรับ G2 และ G3)
        $categories = BusinessCategory::withCount('businesses')->get();
        $categoryData = $categories->map(function ($cat) {
            $catId = $cat->category_id;
            $total = $cat->businesses_count;

            $completed = Business::where('category_id', $catId)->where('workflow_status', 'completed')->count();
            $pendingPrint = Business::where('category_id', $catId)->where('workflow_status', 'pending_print')->count();
            $pendingInspection = Business::where('category_id', $catId)->where('workflow_status', 'pending_inspection')->count();
            $pendingRequest = Business::where('category_id', $catId)->where('workflow_status', 'pending_request')->count();

            // คำนวณอัตราความคืบหน้า (ตรวจผ่านแล้ว + ออกใบอนุญาตแล้ว)
            $progressed = $completed + $pendingPrint;
            $rate = $total > 0 ? round(($progressed / $total) * 100, 1) : 0;

            $status = 'needs_attention';
            if ($rate >= 100) {
                $status = 'all_completed';
            } elseif ($rate >= 80) {
                $status = 'almost';
            } elseif ($rate >= 50) {
                $status = 'in_progress';
            }

            return [
                'id' => $catId,
                'name' => $cat->category_name,
                'total' => $total,
                'completed' => $completed,
                'pending_print' => $pendingPrint,
                'pending_inspection' => $pendingInspection,
                'pending_request' => $pendingRequest,
                'submissionRate' => $rate,
                'status' => $status,
            ];
        });

        $categoryStats = $categories->map(function ($cat) {
            return [
                'name' => $cat->category_name,
                'count' => $cat->businesses_count,
            ];
        });

        // สถิติตามระยะเวลาหมดอายุ 5 ระดับ (สำหรับ G4 ResultLevelChart) — ใบล่าสุดเท่านั้น
        $d30 = Business::whereHas('latestLicense', fn ($q) =>
            $q->whereBetween('expire_date', [$today, Carbon::today()->addDays(30)])
              ->whereNotIn('status', ['expired'])
        )->count();

        $d60 = Business::whereHas('latestLicense', fn ($q) =>
            $q->whereBetween('expire_date', [Carbon::today()->addDays(31), Carbon::today()->addDays(60)])
              ->whereNotIn('status', ['expired'])
        )->count();

        $d90 = Business::whereHas('latestLicense', fn ($q) =>
            $q->whereBetween('expire_date', [Carbon::today()->addDays(61), $in90Days])
              ->whereNotIn('status', ['expired'])
        )->count();

        $resultLevels = [
            'expired' => ['label' => 'หมดอายุแล้ว', 'count' => $expiredCount, 'color' => '#e11d48'],
            'd30' => ['label' => '1-30 วัน', 'count' => $d30, 'color' => '#f43f5e'],
            'd60' => ['label' => '31-60 วัน', 'count' => $d60, 'color' => '#475569'],
            'd90' => ['label' => '61-90 วัน', 'count' => $d90, 'color' => '#10b981'],
            'active' => ['label' => 'เกิน 90 วัน (ปกติ)', 'count' => $activeCount, 'color' => '#047857'],
        ];

        $timelineStats = [
            ['name' => 'หมดอายุแล้ว', 'count' => $expiredCount, 'fill' => '#ef4444'],
            ['name' => '1-30 วัน', 'count' => $d30, 'fill' => '#f97316'],
            ['name' => '31-60 วัน', 'count' => $d60, 'fill' => '#eab308'],
            ['name' => '61-90 วัน', 'count' => $d90, 'fill' => '#3b82f6'],
            ['name' => 'เกิน 90 วัน', 'count' => $activeCount, 'fill' => '#10b981'],
        ];

        // รอบการออกตรวจทั้งหมด
        $rounds = InspectionRound::orderBy('inspection_date', 'desc')->get();

        // การออกตรวจล่าสุด 5 รายการ
        $recentInspections = InspectionRecord::with(['business.owner', 'round'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'metrics' => [
                'totalBusinesses' => $totalBusinesses,
                'totalOwners' => $totalOwners,
                'expiredCount' => $expiredCount,
                'expiringCount' => $expiringCount,
                'activeCount' => $activeCount,
                'pendingRequestCount' => $pendingRequestCount,
                'pendingInspectionCount' => $pendingInspectionCount,
                'pendingPrintCount' => $pendingPrintCount,
                'completedCount' => $completedCount,
            ],
            'stageTotals' => $stageTotals,
            'categoryData' => $categoryData,
            'resultLevels' => $resultLevels,
            'categoryStats' => $categoryStats,
            'timelineStats' => $timelineStats,
            'rounds' => $rounds,
            'categories' => $categories,
            'selectedRound' => $selectedRound,
            'selectedCategory' => $selectedCategory,
            'recentInspections' => $recentInspections,
        ]);
    }
}

