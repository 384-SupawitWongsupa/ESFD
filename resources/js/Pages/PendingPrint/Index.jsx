import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import InspectionStatusBadge from '@/Components/InspectionStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { formatThaiDate, formatCitizenId } from '@/lib/utils';
import { Printer, FileDown, CheckCircle2 } from 'lucide-react';

export default function PendingPrintIndex({ businesses, filters, stats }) {
    const [keyword, setKeyword] = useState(filters.q || '');
    const [activeStatus, setActiveStatus] = useState(filters.status || 'all');

    const handleSearch = (e) => {
        e?.preventDefault();
        router.get('/pending-print', { q: keyword, status: activeStatus }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status) => {
        setActiveStatus(status);
        router.get('/pending-print', { q: keyword, status }, { preserveState: true, replace: true });
    };

    const handleMarkPrinted = (businessId) => {
        if (window.confirm('ยืนยันว่าพิมพ์ใบ อภ.๒ แล้ว?')) {
            router.post(`/pending-print/${businessId}/mark-printed`, {}, {
                preserveScroll: true,
            });
        }
    };

    const statusTabs = [
        { key: 'all', label: `ทั้งหมด (${stats.total})` },
        { key: 'pending_inspection', label: `ยังไม่ได้ออกตรวจ (${stats.pending_inspection})` },
        { key: 'inspected', label: `ออกตรวจแล้ว รอพิมพ์ (${stats.inspected_not_printed})` },
    ];

    return (
        <AuthenticatedLayout
            title="รายการรอพิมพ์ใบอนุญาต อภ.๒"
            description="แสดงสถานประกอบการที่ยังไม่ได้พิมพ์ใบอนุญาตประกอบกิจการ"
        >
            <Head title="รอพิมพ์ใบ อภ.๒" />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">รายการทั้งหมดที่รอพิมพ์</div>
                        <div className="mt-2 w-full h-1 bg-slate-100 rounded-full">
                            <div className="h-1 bg-slate-400 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="text-2xl font-bold text-orange-700">{stats.pending_inspection}</div>
                        <div className="text-xs text-orange-600 mt-1 font-medium">ยังไม่ได้ออกตรวจ</div>
                        <div className="mt-2 w-full h-1 bg-orange-100 rounded-full">
                            <div
                                className="h-1 bg-orange-400 rounded-full"
                                style={{ width: stats.total > 0 ? `${(stats.pending_inspection / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-100 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="text-2xl font-bold text-emerald-700">{stats.inspected_not_printed}</div>
                        <div className="text-xs text-emerald-600 mt-1 font-medium">ออกตรวจแล้ว รอพิมพ์</div>
                        <div className="mt-2 w-full h-1 bg-emerald-100 rounded-full">
                            <div
                                className="h-1 bg-emerald-500 rounded-full"
                                style={{ width: stats.total > 0 ? `${(stats.inspected_not_printed / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter Bar */}
            <Card className="mb-5 border-slate-200 shadow-sm">
                <CardContent className="pt-4 pb-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="ค้นหาชื่อร้าน, ชื่อเจ้าของ, หรือเลขบัตรประชาชน..."
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition"
                        />
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5">
                            ค้นหา
                        </Button>
                        {keyword && (
                            <Button
                                type="button"
                                variant="outline"
                                className="text-xs font-medium"
                                onClick={() => { setKeyword(''); router.get('/pending-print', { status: activeStatus }, { replace: true }); }}
                            >
                                ล้างผล
                            </Button>
                        )}
                    </form>

                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleStatusFilter(tab.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                    activeStatus === tab.key
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Business List */}
            {businesses.data.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <div className="text-slate-400 text-sm font-medium">ไม่พบรายการที่รอพิมพ์ใบ อภ.๒</div>
                        <div className="text-slate-400 text-xs mt-1">สถานประกอบการทั้งหมดพิมพ์ใบอนุญาตเรียบร้อยแล้ว</div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {businesses.data.map((business) => {
                        const latestLic = business.licenses?.[0];
                        const latestInsp = business.inspection_records?.[0];

                        return (
                            <Card
                                key={business.business_id}
                                className="border border-slate-200 bg-white shadow-xs transition hover:border-slate-300"
                            >
                                <CardContent className="pt-5 pb-5">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        {/* Left: Business Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <h3 className="text-base font-bold text-slate-900">
                                                    {business.shop_name || 'ไม่มีชื่อทางการค้า'}
                                                </h3>
                                                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-normal border border-slate-200">
                                                    {business.category?.category_name}
                                                </span>
                                                <InspectionStatusBadge
                                                    status={business.inspection_status}
                                                    workflowStatus={business.workflow_status}
                                                />
                                                {latestLic && (
                                                    <StatusBadge status={latestLic.status} expireDate={latestLic.expire_date} />
                                                )}
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-700">
                                                <div>
                                                    <span className="text-slate-500">เจ้าของกิจการ: </span>
                                                    <span className="font-normal text-slate-900">{business.owner?.owner_name || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">เลขบัตรประชาชน: </span>
                                                    <span className="text-slate-800 font-normal">{formatCitizenId(business.owner?.citizen_id) || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">ที่ตั้ง: </span>
                                                    <span className="text-slate-800">
                                                        เลขที่ {business.shop_address || '-'} หมู่ {business.shop_moo || '-'} ต.ดอยงาม
                                                    </span>
                                                </div>
                                                {latestLic && (
                                                    <>
                                                        <div>
                                                            <span className="text-slate-500">เล่ม/เลขที่: </span>
                                                            <span className="font-normal text-slate-900">
                                                                {latestLic.receipt_book || '-'}/{latestLic.receipt_no || '-'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">วันหมดอายุ: </span>
                                                            <span className="font-normal text-slate-900">{formatThaiDate(latestLic.expire_date)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {business.inspection_status === 'pending' && (
                                                    <div className="sm:col-span-2 lg:col-span-3 mt-1">
                                                        <span className="inline-block text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1 font-normal">
                                                            กิจการลงทะเบียนใหม่ ยังไม่ผ่านการออกตรวจสุขลักษณะ — กรุณานัดหมายออกตรวจก่อนออกใบอนุญาต
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Action Buttons */}
                                        <div className="flex flex-wrap md:flex-col gap-2 md:min-w-[170px] md:items-stretch shrink-0">
                                            <Link
                                                href={`/documents/preview/${business.business_id}`}
                                                className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal transition shadow-xs"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span>พิมพ์ใบ อภ.๒</span>
                                            </Link>
                                            <a
                                                href={`/documents/aph2/${business.business_id}/word`}
                                                className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200 transition"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                <span>ดาวน์โหลด Word</span>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleMarkPrinted(business.business_id)}
                                                className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-normal border border-slate-200 transition"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                                <span>พิมพ์เรียบร้อยแล้ว</span>
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {businesses.last_page > 1 && (
                <div className="mt-6">
                    <Pagination links={businesses.links} />
                </div>
            )}
        </AuthenticatedLayout>
    );
}

