import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import InspectionStatusBadge from '@/Components/InspectionStatusBadge';
import InspectionRecordModal from '@/Components/InspectionRecordModal';
import { Card, CardContent } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { formatThaiDate, formatThaiDateTime, formatCitizenId } from '@/lib/utils';
import { Printer, FileDown, CheckCircle2, ClipboardCheck, Eye, Clock } from 'lucide-react';

export default function PendingPrintIndex({ businesses, filters, stats, rounds = [] }) {
    const [keyword, setKeyword] = useState(filters.q || '');
    const [activeStatus, setActiveStatus] = useState(filters.status || 'all');
    const [selectedBusinessForInspection, setSelectedBusinessForInspection] = useState(null);

    const handleSearch = (e) => {
        e?.preventDefault();
        router.get('/pending-print', { q: keyword, status: activeStatus }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status) => {
        setActiveStatus(status);
        router.get('/pending-print', { q: keyword, status }, { preserveState: true, replace: true });
    };

    const handleMarkPrinted = (businessId) => {
        if (window.confirm('ยืนยันว่าพิมพ์ใบ อภ.๒ แล้ว? ระบบจะเปลี่ยนสถานะเป็นพิมพ์แล้วเสร็จสิ้น')) {
            router.post(`/pending-print/${businessId}/mark-printed`, {}, {
                preserveScroll: true,
            });
        }
    };

    const statusTabs = [
        { key: 'all', label: `ทั้งหมด (${stats.total || 0})` },
        { key: 'pending_inspection', label: `ยังไม่ได้ออกตรวจ (${stats.pending_inspection || 0})` },
        { key: 'inspected', label: `ออกตรวจแล้ว รอพิมพ์ (${stats.inspected_not_printed || 0})` },
        { key: 'completed', label: `พิมพ์ใบอนุญาตแล้ว (${stats.completed || 0})` },
    ];

    return (
        <AuthenticatedLayout
            title="สถานะกิจการ"
            description="แสดงสถานะขั้นตอนของสถานประกอบการและรายการพิมพ์ใบอนุญาต อภ.๒"
        >
            <Head title="สถานะกิจการ" />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card
                    onClick={() => handleStatusFilter('all')}
                    className={`cursor-pointer transition border shadow-xs hover:border-slate-400 ${
                        activeStatus === 'all' ? 'ring-2 ring-slate-800 border-slate-800' : 'border-slate-200'
                    }`}
                >
                    <CardContent className="pt-5 pb-4">
                        <div className="text-2xl font-bold text-slate-900">{stats.total || 0}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">กิจการทั้งหมดในระบบ</div>
                        <div className="mt-2 w-full h-1 bg-slate-100 rounded-full">
                            <div className="h-1 bg-slate-400 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => handleStatusFilter('pending_inspection')}
                    className={`cursor-pointer transition border shadow-xs hover:border-orange-400 ${
                        activeStatus === 'pending_inspection' ? 'ring-2 ring-orange-500 border-orange-500' : 'border-orange-100'
                    }`}
                >
                    <CardContent className="pt-5 pb-4">
                        <div className="text-2xl font-bold text-orange-700">{stats.pending_inspection || 0}</div>
                        <div className="text-xs text-orange-600 mt-1 font-medium">ยังไม่ได้ออกตรวจ (รอตรวจ)</div>
                        <div className="mt-2 w-full h-1 bg-orange-100 rounded-full">
                            <div
                                className="h-1 bg-orange-400 rounded-full"
                                style={{ width: stats.total > 0 ? `${(stats.pending_inspection / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => handleStatusFilter('inspected')}
                    className={`cursor-pointer transition border shadow-xs hover:border-blue-400 ${
                        activeStatus === 'inspected' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-blue-100'
                    }`}
                >
                    <CardContent className="pt-5 pb-4">
                        <div className="text-2xl font-bold text-blue-700">{stats.inspected_not_printed || 0}</div>
                        <div className="text-xs text-blue-600 mt-1 font-medium">ออกตรวจแล้ว รอพิมพ์ใบ อภ.๒</div>
                        <div className="mt-2 w-full h-1 bg-blue-100 rounded-full">
                            <div
                                className="h-1 bg-blue-500 rounded-full"
                                style={{ width: stats.total > 0 ? `${(stats.inspected_not_printed / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => handleStatusFilter('completed')}
                    className={`cursor-pointer transition border shadow-xs hover:border-emerald-400 ${
                        activeStatus === 'completed' ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-emerald-100'
                    }`}
                >
                    <CardContent className="pt-5 pb-4">
                        <div className="text-2xl font-bold text-emerald-700">{stats.completed || 0}</div>
                        <div className="text-xs text-emerald-600 mt-1 font-medium">พิมพ์ใบอนุญาตแล้ว (เสร็จสิ้น)</div>
                        <div className="mt-2 w-full h-1 bg-emerald-100 rounded-full">
                            <div
                                className="h-1 bg-emerald-500 rounded-full"
                                style={{ width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }}
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
                        <div className="text-slate-500 text-sm font-semibold">ไม่พบรายการสถานประกอบการ</div>
                        <div className="text-slate-400 text-xs mt-1">
                            {activeStatus === 'pending_inspection' && 'ไม่มีกิจการที่รอการออกตรวจสุขลักษณะ'}
                            {activeStatus === 'inspected' && 'ไม่มีกิจการที่รอพิมพ์ใบ อภ.๒'}
                            {activeStatus === 'completed' && 'ยังไม่มีกิจการที่พิมพ์ใบอนุญาตเสร็จสิ้น'}
                            {activeStatus === 'all' && 'ไม่มีข้อมูลสถานประกอบการตรงตามเงื่อนไขที่ค้นหา'}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {businesses.data.map((business) => {
                        const latestLic = business.licenses?.[0];
                        const isPendingInspection = business.inspection_status === 'pending' ||
                            business.workflow_status === 'pending_inspection' ||
                            business.workflow_status === 'pending_request';
                        const isCompleted = business.workflow_status === 'completed' ||
                            (latestLic && latestLic.is_printed);

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
                                                {isCompleted && (
                                                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>พิมพ์แล้ว {latestLic?.printed_at ? `(${formatThaiDateTime(latestLic.printed_at, true)})` : ''}</span>
                                                    </span>
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
                                                {latestLic?.is_printed && (
                                                    <div className="sm:col-span-2 lg:col-span-3 mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span>วันเวลาที่พิมพ์ใบอนุญาต:</span>
                                                        <span className="font-bold text-emerald-900">
                                                            {latestLic.printed_at ? formatThaiDateTime(latestLic.printed_at) : (latestLic.updated_at ? formatThaiDateTime(latestLic.updated_at) : '-')}
                                                        </span>
                                                    </div>
                                                )}
                                                {isPendingInspection && (
                                                    <div className="sm:col-span-2 lg:col-span-3 mt-1">
                                                        <span className="inline-block text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 font-normal">
                                                            📌 กิจการยังไม่ได้ออกตรวจสุขลักษณะ — กรุณากดปุ่ม <strong>"ออกตรวจสุขลักษณะ"</strong> เพื่อบันทึกผลการตรวจและออกใบอนุญาต
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Action Buttons */}
                                        <div className="flex flex-wrap md:flex-col gap-2 md:min-w-[170px] md:items-stretch shrink-0">
                                            {isPendingInspection ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedBusinessForInspection(business)}
                                                        className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition shadow-xs"
                                                    >
                                                        <ClipboardCheck className="w-4 h-4" />
                                                        <span>ออกตรวจสุขลักษณะ</span>
                                                    </button>
                                                    <Link
                                                        href={`/businesses/${business.business_id}`}
                                                        className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200 transition"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>ดูข้อมูลร้าน</span>
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={`/documents/preview/${business.business_id}?form=aph2&tab=aph2&from=pending-print`}
                                                        className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal transition shadow-xs"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                        <span>{isCompleted ? 'พิมพ์ใบ อภ.๒ ซ้ำ' : 'พิมพ์ใบ อภ.๒'}</span>
                                                    </Link>
                                                    <a
                                                        href={`/documents/aph2/${business.business_id}/word`}
                                                        className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200 transition"
                                                    >
                                                        <FileDown className="w-4 h-4" />
                                                        <span>ดาวน์โหลด Word</span>
                                                    </a>
                                                    {!isCompleted && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMarkPrinted(business.business_id)}
                                                            className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-normal border border-slate-200 transition"
                                                            title="ทำเครื่องหมายว่าพิมพ์ใบอนุญาตแล้ว และย้ายไปสถานะพิมพ์แล้ว"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                                            <span>พิมพ์เรียบร้อยแล้ว</span>
                                                        </button>
                                                    )}
                                                </>
                                            )}
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

            {/* Inspection Record Modal for Pending Inspection */}
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
