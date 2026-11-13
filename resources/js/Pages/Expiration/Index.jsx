import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import InspectionRecordModal from '@/Components/InspectionRecordModal';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { formatThaiDate, formatCitizenId, formatPhone } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function ExpirationIndex({
    businesses,
    tab,
    category,
    moo,
    q,
    counts,
    categories,
    rounds,
}) {
    const [keyword, setKeyword] = useState(q || '');
    const [selectedBusinessForInspection, setSelectedBusinessForInspection] = useState(null);

    const handleFilterChange = (newTab, newCategory, newMoo, newQ) => {
        router.get('/expirations', {
            tab: newTab !== undefined ? newTab : tab,
            category: newCategory !== undefined ? newCategory : category,
            moo: newMoo !== undefined ? newMoo : moo,
            q: newQ !== undefined ? newQ : keyword,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleExportClientExcel = () => {
        if (!businesses.data || businesses.data.length === 0) return;

        const rows = businesses.data.map((b, idx) => {
            const lic = b.licenses?.[0];
            return {
                'ลำดับ': idx + 1,
                'ชื่อผู้ประกอบการ': b.owner?.owner_name || '-',
                'เลขประจำตัวประชาชน': formatCitizenId(b.owner?.citizen_id) || b.owner?.juristic_id || '-',
                'เบอร์โทรศัพท์': formatPhone(b.owner?.phone) || '-',
                'ที่อยู่ผู้ประกอบการ': `${b.owner?.office_address || '-'} ม.${b.owner?.moo || '-'} ต.ดอยงาม อ.พาน จ.เชียงราย`,
                'ชื่อสถานประกอบการ': b.shop_name || 'ไม่มีชื่อทางการค้า',
                'ประเภทกิจการ': b.operation_type || '-',
                'ที่ตั้งสถานประกอบการ': `เลขที่ ${b.shop_address || '-'} ม.${b.shop_moo || '-'} ต.ดอยงาม`,
                'เล่มที่/เลขที่ใบเสร็จ': `${lic?.receipt_book || '-'}/${lic?.receipt_no || '-'}`,
                'วันสิ้นอายุใบอนุญาต': formatThaiDate(lic?.expire_date),
                'สถานะ': lic?.status === 'expired' ? 'หมดอายุแล้ว' : 'ใกล้หมดอายุ'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อแจ้งเตือนต่ออายุ');
        XLSX.writeFile(workbook, `รายชื่อแจ้งเตือนต่ออายุ_${tab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <AuthenticatedLayout
            title="ระบบติดตามวันสิ้นอายุใบอนุญาตและการแจ้งเตือน"
            description="จัดกลุ่มสถานะใบอนุญาต ออกตรวจต่ออายุ และส่งออกไฟล์แจ้งเตือนทางการ"
        >
            <Head title="ติดตามวันสิ้นอายุใบอนุญาต" />

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="page-title">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        ระบบติดตามวันสิ้นอายุใบอนุญาต
                    </h2>
                    <p className="subtitle text-xs text-slate-500 mt-0.5">
                        จัดกลุ่มสถานะใบอนุญาต บันทึกออกตรวจต่ออายุ และส่งออกรายงาน
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleExportClientExcel}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                    >
                        ส่งออกไฟล์ Excel (.xlsx)
                    </Button>
                    <a
                        href={`/expirations/export?tab=${tab}`}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-300 shadow-xs"
                    >
                        ดาวน์โหลด CSV
                    </a>
                </div>
            </div>

            {/* Status Filter Tabs (Clean, Formal, No Emojis) */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => handleFilterChange('expired', undefined, undefined, undefined)}
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        tab === 'expired'
                            ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-800 border-slate-300'
                    }`}
                >
                    <span>หมดอายุแล้ว</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        tab === 'expired' ? 'bg-rose-900 text-rose-100' : 'bg-rose-100 text-rose-800 font-bold'
                    }`}>
                        {counts.expired}
                    </span>
                </button>

                <button
                    onClick={() => handleFilterChange('expiring', undefined, undefined, undefined)}
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        tab === 'expiring'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border-slate-300'
                    }`}
                >
                    <span>ใกล้หมดอายุ (ภายใน 90 วัน)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        tab === 'expiring' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900 font-bold'
                    }`}>
                        {counts.expiring}
                    </span>
                </button>

                <button
                    onClick={() => handleFilterChange('active', undefined, undefined, undefined)}
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        tab === 'active'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border-slate-300'
                    }`}
                >
                    <span>ปกติ (เกิน 90 วัน)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        tab === 'active' ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-800 font-bold'
                    }`}>
                        {counts.active}
                    </span>
                </button>
            </div>

            {/* Filter Bar (Formal Controls) */}
            <Card className="p-4 mb-6 border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-slate-700 font-bold">ตัวกรองข้อมูล:</span>

                        {/* Moo Filter */}
                        <select
                            value={moo}
                            onChange={(e) => handleFilterChange(undefined, undefined, e.target.value, undefined)}
                            className="text-xs rounded-xl border border-slate-300 py-2.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-slate-800"
                        >
                            <option value="all">ทุกหมู่บ้านในตำบลดอยงาม</option>
                            {Array.from({ length: 15 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                    หมู่ที่ {m}
                                </option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={category}
                            onChange={(e) => handleFilterChange(undefined, e.target.value, undefined, undefined)}
                            className="text-xs rounded-xl border border-slate-300 py-2.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-slate-800"
                        >
                            <option value="all">ทุกประเภทกิจการ</option>
                            {categories.map((c) => (
                                <option key={c.category_id} value={c.category_id}>
                                    {c.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Search */}
                    <div className="w-full sm:w-72">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange(undefined, undefined, undefined, keyword)}
                            placeholder="ค้นหาชื่อร้าน หรือชื่อเจ้าของ..."
                            className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                        />
                    </div>
                </div>
            </Card>

            {/* Business Table */}
            <Card className="overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-3.5 px-4">ผู้ประกอบการ / เบอร์โทรศัพท์</th>
                                <th className="py-3.5 px-4">ชื่อสถานประกอบการ / ลักษณะกิจการ</th>
                                <th className="py-3.5 px-4">ที่ตั้งร้าน</th>
                                <th className="py-3.5 px-4">เล่ม/เลขที่ใบเสร็จ</th>
                                <th className="py-3.5 px-4">วันสิ้นอายุ</th>
                                <th className="py-3.5 px-4">สถานะ</th>
                                <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {businesses.data && businesses.data.length > 0 ? (
                                businesses.data.map((b) => {
                                    const latestLic = b.licenses?.[0];
                                    return (
                                        <tr key={b.business_id} className="hover:bg-slate-50 transition">
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 text-sm">{b.owner?.owner_name}</div>
                                                <div className="text-slate-500 text-xs mt-0.5">
                                                    {formatPhone(b.owner?.phone) || '-'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {b.shop_name || 'ไม่มีชื่อทางการค้า'}
                                                </div>
                                                <div className="text-slate-600 text-xs mt-0.5">
                                                    {b.operation_type || '-'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-slate-800 font-medium">
                                                หมู่ที่ {b.shop_moo || b.owner?.moo || '-'}
                                            </td>
                                            <td className="py-4 px-4 font-normal text-slate-700">
                                                {latestLic?.receipt_book || '-'}/{latestLic?.receipt_no || '-'}
                                            </td>
                                            <td className="py-4 px-4 font-semibold text-slate-900 text-xs">
                                                {formatThaiDate(latestLic?.expire_date)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <StatusBadge
                                                    status={latestLic?.status}
                                                    expireDate={latestLic?.expire_date}
                                                />
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedBusinessForInspection(b)}
                                                        className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs"
                                                    >
                                                        ออกตรวจต่ออายุ
                                                    </button>
                                                    <Link
                                                        href={`/businesses/${b.business_id}`}
                                                        className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                                                    >
                                                        ดูข้อมูล
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        ไม่พบข้อมูลสถานประกอบการในเงื่อนไขนี้
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={businesses.links} />
            </Card>

            {/* Inspection Record Modal for Renewal */}
            {selectedBusinessForInspection && (
                <InspectionRecordModal
                    isOpen={true}
                    onClose={() => setSelectedBusinessForInspection(null)}
                    business={selectedBusinessForInspection}
                    rounds={rounds}
                />
            )}
        </AuthenticatedLayout>
    );
}
