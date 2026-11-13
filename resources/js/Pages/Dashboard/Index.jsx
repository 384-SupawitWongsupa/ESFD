import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Printer, ArrowRight, ShieldCheck, Clock, AlertTriangle, Store } from 'lucide-react';
import { ChartCard } from '@/Components/MIS/chart-kit';
import {
    SubDistrictStatusBar,
    CategoryProgressRateChart,
    CategoryStackChart,
    ResultLevelChart,
} from '@/Components/MIS/status-charts';
import { StatusDonut } from '@/Components/MIS/status-donut';

export default function Dashboard({
    metrics,
    stageTotals,
    categoryData,
    resultLevels,
    rounds = [],
    categories = [],
    selectedRound = 'all',
    selectedCategory = 'all',
    recentInspections = [],
}) {
    const handleFilterChange = (round, category) => {
        router.get('/', {
            round: round !== undefined ? round : selectedRound,
            category: category !== undefined ? category : selectedCategory,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout
            title="ระบบสารสนเทศเพื่อการบริหาร (MIS Dashboard)"
            description="สถิติภาพรวมสถานประกอบการ การออกตรวจสุขลักษณะ และการติดตามสถานะใบอนุญาต อบต.ดอยงาม"
        >
            <Head title="แดชบอร์ดสารสนเทศเพื่อการบริหาร (MIS)" />

            {/* Filter and Actions Bar (Print Hidden) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200/90 mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3.5">
                    <span className="text-sm font-bold text-slate-800">ตัวกรองข้อมูล:</span>

                    {/* Filter Round */}
                    <select
                        value={selectedRound}
                        onChange={(e) => handleFilterChange(e.target.value, undefined)}
                        className="text-sm font-normal rounded-xl border border-slate-300 py-2.5 px-3.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                        <option value="all">ข้อมูลภาพรวมตำบล (รวมทุกวาระ)</option>
                        {rounds.map((r) => (
                            <option key={r.round_id} value={r.round_id}>
                                รอบตรวจ: {r.round_name}
                            </option>
                        ))}
                    </select>

                    {/* Filter Category */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => handleFilterChange(undefined, e.target.value)}
                        className="text-sm font-normal rounded-xl border border-slate-300 py-2.5 px-3.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                        <option value="all">ทุกประเภทกิจการ</option>
                        {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                                {c.category_name}
                            </option>
                        ))}
                    </select>

                    {(selectedRound !== 'all' || selectedCategory !== 'all') && (
                        <button
                            type="button"
                            onClick={() => handleFilterChange('all', 'all')}
                            className="text-sm text-emerald-800 font-normal hover:underline"
                        >
                            ล้างตัวกรอง
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="text-sm font-normal text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-2 py-2 px-3.5"
                    >
                        <Printer className="w-4 h-4 text-slate-500" />
                        พิมพ์รายงาน
                    </Button>
                    <Link href="/pending-print">
                        <Button variant="outline" size="sm" className="text-sm font-normal text-emerald-800 border-emerald-300 hover:bg-emerald-50 py-2 px-3.5">
                            รอพิมพ์ใบ อภ.๒ ({metrics.pendingPrintCount || 0})
                        </Button>
                    </Link>
                    <Link href="/businesses/create">
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-normal py-2 px-4 shadow-xs">
                            + ลงทะเบียนใหม่
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric KPI Cards (ขนาดใหญ่ขึ้น, ตัวเลข Regular ตามข้อกำหนด) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* 1. กิจการทั้งหมด */}
                <Card className="border-slate-200 shadow-xs">
                    <CardContent className="p-6 sm:p-7">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                สถานประกอบการทั้งหมด
                            </span>
                            <Store className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="mt-3 text-4xl font-normal text-slate-900">{metrics.totalBusinesses}</div>
                        <div className="mt-3 text-sm font-normal text-slate-500">
                            ผู้ประกอบการในพื้นที่: <span className="font-normal text-slate-800">{metrics.totalOwners} ราย</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. หมดอายุแล้ว */}
                <Link href="/expirations?tab=expired" className="block">
                    <Card className="hover:border-rose-300 border-rose-200 bg-rose-50/20 transition group shadow-xs">
                        <CardContent className="p-6 sm:p-7">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-rose-700 uppercase tracking-wider">
                                    หมดอายุแล้ว
                                </span>
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                            </div>
                            <div className="mt-3 text-4xl font-normal text-rose-700">{metrics.expiredCount}</div>
                            <div className="mt-3 text-sm text-rose-700 font-normal group-hover:underline flex items-center gap-1.5">
                                <span>ออกตรวจต่ออายุ</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* 3. ใกล้หมดอายุ (ภายใน 90 วัน) */}
                <Link href="/expirations?tab=expiring" className="block">
                    <Card className="hover:border-slate-400 border-slate-200 bg-slate-50/40 transition group shadow-xs">
                        <CardContent className="p-6 sm:p-7">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    ใกล้หมดอายุ (ใน 90 วัน)
                                </span>
                                <Clock className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="mt-3 text-4xl font-normal text-slate-900">{metrics.expiringCount}</div>
                            <div className="mt-3 text-sm text-slate-600 font-normal group-hover:underline flex items-center gap-1.5">
                                <span>ออกตรวจต่ออายุ</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* 4. ปกติ */}
                <Link href="/expirations?tab=active" className="block">
                    <Card className="hover:border-emerald-300 border-emerald-200 bg-emerald-50/20 transition group shadow-xs">
                        <CardContent className="p-6 sm:p-7">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
                                    ใบอนุญาตปกติ
                                </span>
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="mt-3 text-4xl font-normal text-emerald-800">{metrics.activeCount}</div>
                            <div className="mt-3 text-sm font-normal text-slate-500">
                                ระยะเวลาสิ้นอายุเกิน 90 วัน
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* แถวที่ 1: สถานะขั้นตอนการขอรับใบอนุญาตทั้งตำบล (G1 — Sub-district Status Bar) */}
            <div className="mb-6">
                <ChartCard
                    title="สัดส่วนขั้นตอนการขอรับใบอนุญาตและออกตรวจสุขลักษณะ"
                    aside={
                        <span className="text-sm font-normal px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                            รวมทั้งหมด {stageTotals?.total || metrics.totalBusinesses} แห่ง
                        </span>
                    }
                >
                    <SubDistrictStatusBar totals={stageTotals || {}} />
                </ChartCard>
            </div>

            {/* แถวที่ 2: แบ่ง 2 คอลัมน์บนจอใหญ่ (xl:grid-cols-2) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* G2: อัตราการดำเนินงานและออกตรวจรายหมวดหมู่ */}
                <ChartCard
                    title="อัตราความคืบหน้าการออกตรวจและได้รับใบอนุญาตรายหมวดหมู่"
                >
                    <CategoryProgressRateChart
                        categories={categoryData || []}
                        target={80}
                        onSelectCategory={(catId) => handleFilterChange(undefined, catId)}
                    />
                </ChartCard>

                {/* G3: สถานะรายหมวดหมู่แบบแท่งซ้อน */}
                <ChartCard
                    title="สัดส่วนขั้นตอนรายหมวดหมู่"
                >
                    <CategoryStackChart categories={categoryData || []} />
                </ChartCard>
            </div>

            {/* แถวที่ 3: สัดส่วนวงแหวน (G5), ระดับผล 5 ระดับ (G4) และรายการออกตรวจล่าสุด */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* G5: Interactive SVG Status Donut */}
                <ChartCard
                    title="สัดส่วนขั้นตอนแบบวงแหวน"
                >
                    <StatusDonut totals={stageTotals || {}} />
                </ChartCard>

                {/* G4: ผลการประเมินและระยะเวลาสิ้นอายุ 5 ระดับ */}
                <ChartCard
                    title="การกระจายตัวตามช่วงวันสิ้นอายุใบอนุญาต"
                >
                    <ResultLevelChart levels={resultLevels || {}} />
                </ChartCard>

                {/* รายการออกตรวจสุขลักษณะล่าสุด */}
                <ChartCard
                    title="บันทึกผลการออกตรวจล่าสุด"
                    aside={
                        <Link href="/inspections" className="text-sm text-emerald-700 hover:text-emerald-800 font-normal underline">
                            ดูทั้งหมด
                        </Link>
                    }
                >
                    <div className="space-y-3">
                        {recentInspections && recentInspections.length > 0 ? (
                            recentInspections.map((rec) => (
                                <div
                                    key={rec.record_id}
                                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition flex items-center justify-between gap-3 text-sm"
                                >
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 truncate">
                                            {rec.business?.shop_name || 'ไม่มีชื่อร้าน'}
                                        </div>
                                        <div className="text-xs font-normal text-slate-500 truncate mt-0.5">
                                            {rec.business?.owner?.owner_name}
                                        </div>
                                        <div className="text-xs font-normal text-emerald-700 mt-0.5">
                                            รอบ: {rec.round?.round_name}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <Link
                                            href={`/documents/preview/${rec.business_id}`}
                                            title="พิมพ์ใบอนุญาต (อภ.๒)"
                                            className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-2xs inline-flex items-center justify-center"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-sm font-normal text-slate-400">
                                ยังไม่มีข้อมูลผลการตรวจล่าสุด
                            </div>
                        )}
                    </div>
                </ChartCard>
            </div>
        </AuthenticatedLayout>
    );
}
