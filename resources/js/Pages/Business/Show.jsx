import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import InspectionStatusBadge from '@/Components/InspectionStatusBadge';
import InspectionRecordModal from '@/Components/InspectionRecordModal';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { formatThaiDate, formatCitizenId, formatPhone } from '@/lib/utils';

export default function BusinessShow({ business, rounds = [] }) {
    const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const latestLicense = business.licenses?.[0];

    const handleIssueRequest = () => {
        router.post(`/businesses/${business.business_id}/issue-request`);
    };

    const handleMarkPrinted = () => {
        if (window.confirm('ยืนยันว่าพิมพ์ใบอนุญาต (อภ.๒) เรียบร้อยแล้ว?')) {
            router.post(`/pending-print/${business.business_id}/mark-printed`, {}, {
                preserveScroll: true,
            });
        }
    };

    const handleDeleteBusiness = () => {
        setIsDeleting(true);
        router.delete(`/businesses/${business.business_id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
            },
        });
    };

    return (
        <AuthenticatedLayout title={`สถานประกอบการ: ${business.shop_name || business.business_id}`}>
            <Head title={business.shop_name || 'รายละเอียดสถานประกอบการ'} />

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/search">
                        <Button variant="outline" size="sm" className="text-xs font-semibold">
                            ย้อนกลับ
                        </Button>
                    </Link>
                    <div className="page-title">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                {business.shop_name || 'ไม่มีชื่อทางการค้า'}
                            </h2>
                            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                                {business.category?.category_name}
                            </span>
                            <InspectionStatusBadge
                                status={business.inspection_status}
                                workflowStatus={business.workflow_status}
                            />
                            <StatusBadge
                                status={latestLicense?.status}
                                expireDate={latestLicense?.expire_date}
                            />
                        </div>
                        <p className="subtitle text-xs text-slate-500 mt-0.5">
                            รหัสสถานประกอบการ: <span className="font-normal text-slate-800">#{business.business_id}</span>
                            {business.request_no && (
                                <span className="ml-3">เลขที่คำขอ: <span className="font-normal text-slate-800">{business.request_no}</span></span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {business.workflow_status === 'pending_request' && (
                        <Button
                            type="button"
                            onClick={handleIssueRequest}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal shadow-xs flex items-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>กดออกใบคำขอ (สธ.๒)</span>
                        </Button>
                    )}

                    {business.workflow_status === 'pending_inspection' && (
                        <Button
                            type="button"
                            onClick={() => setInspectionModalOpen(true)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal shadow-xs flex items-center gap-1.5"
                        >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>บันทึกผลการออกตรวจ / ต่ออายุ</span>
                        </Button>
                    )}

                    <a
                        href={`/documents/sth2/${business.business_id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 transition"
                    >
                        พิมพ์แบบคำขอ (สธ.๒)
                    </a>

                    {(business.workflow_status === 'pending_print' || business.workflow_status === 'completed' || business.licenses?.length > 0) && (
                        <Link href={`/documents/preview/${business.business_id}`}>
                            <Button variant="secondary" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                                พิมพ์ใบอนุญาต (อภ.๒)
                            </Button>
                        </Link>
                    )}

                    {business.workflow_status === 'pending_print' && (
                        <button
                            type="button"
                            onClick={handleMarkPrinted}
                            className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition"
                        >
                            ทำเครื่องหมายพิมพ์แล้ว
                        </button>
                    )}

                    <a
                        href={`/documents/aph2/${business.business_id}/word`}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-blue-700 font-semibold text-xs border border-blue-300 transition"
                    >
                        ดาวน์โหลด Word (.docx)
                    </a>

                    <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-xs border border-red-200 transition"
                        title="ลบข้อมูลสถานประกอบการนี้"
                    >
                        ลบสถานประกอบการ
                    </button>
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* ข้อมูลเจ้าของ */}
                <Card className="border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            ข้อมูลผู้ประกอบการ / เจ้าของ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">ชื่อ - นามสกุล:</span>
                                <span className="font-bold text-slate-900 text-sm">{business.owner?.owner_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">เลขประจำตัวประชาชน:</span>
                                <span className="text-slate-900 font-normal">{formatCitizenId(business.owner?.citizen_id) || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">ทะเบียนนิติบุคคล:</span>
                                <span className="text-slate-800 font-normal">{business.owner?.juristic_id || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                                <span className="text-slate-800 font-medium">{formatPhone(business.owner?.phone) || '-'}</span>
                            </div>
                            <div className="flex justify-between items-start py-1.5">
                                <span className="text-slate-500 shrink-0">ที่อยู่ตามทะเบียนบ้าน:</span>
                                <span className="text-slate-800 text-right font-medium">
                                    {business.owner?.office_address} หมู่ที่ {business.owner?.moo} ต.{business.owner?.subdistrict} อ.{business.owner?.district} จ.{business.owner?.province}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ข้อมูลสถานประกอบการ */}
                <Card className="border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            ข้อมูลลักษณะกิจการและที่ตั้ง
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">การดำเนินกิจการ:</span>
                                <span className="font-semibold text-slate-900">{business.operation_type || '-'}</span>
                            </div>
                            <div className="flex justify-between items-start py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 shrink-0">ที่ตั้งสถานประกอบการ:</span>
                                <span className="text-slate-800 font-medium text-right">
                                    เลขที่ {business.shop_address || '-'} หมู่ที่ {business.shop_moo || '-'} ตำบลดอยงาม
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">โทรศัพท์ร้าน:</span>
                                <span className="text-slate-800">{formatPhone(business.shop_phone) || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">พื้นที่ประกอบการ:</span>
                                <span className="text-slate-800 font-medium">{business.business_area || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">กำลังเครื่องจักร:</span>
                                <span className="text-slate-800">{business.machine_power || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-slate-500">จำนวนคนงาน:</span>
                                <span className="text-slate-800 font-medium">{business.worker_count || '-'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ประวัติใบอนุญาตและการชำระเงิน */}
            <Card className="overflow-hidden mb-6 border-slate-200">
                <CardHeader className="py-3.5 px-5 border-b border-slate-200 bg-slate-50">
                    <CardTitle className="text-sm font-bold text-slate-800">
                        ประวัติใบอนุญาตและการชำระเงิน
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-3 px-5">เล่มที่/เลขที่ใบเสร็จ</th>
                                <th className="py-3 px-5">ค่าธรรมเนียม</th>
                                <th className="py-3 px-5">วันที่ออกใบเสร็จ</th>
                                <th className="py-3 px-5">วันสิ้นอายุ</th>
                                <th className="py-3 px-5">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {business.licenses?.map((lic) => (
                                <tr key={lic.license_id} className="hover:bg-slate-50 transition">
                                    <td className="py-3 px-5 font-mono font-medium text-slate-900">
                                        {lic.receipt_book || '-'}/{lic.receipt_no || '-'}
                                    </td>
                                    <td className="py-3 px-5 font-semibold text-slate-800">
                                        {Number(lic.fee).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                    </td>
                                    <td className="py-3 px-5">{formatThaiDate(lic.receipt_date)}</td>
                                    <td className="py-3 px-5 font-semibold text-slate-900">{formatThaiDate(lic.expire_date)}</td>
                                    <td className="py-3 px-5">
                                        <StatusBadge status={lic.status} expireDate={lic.expire_date} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteBusiness}
                title="ยืนยันการลบสถานประกอบการ"
                itemName={business.shop_name || `สถานประกอบการ #${business.business_id}`}
                itemType="สถานประกอบการ"
                warningText="ข้อมูลสถานประกอบการ ใบอนุญาต และประวัติการออกตรวจทั้งหมดของกิจการนี้จะถูกลบออกจากระบบอย่างถาวร"
                processing={isDeleting}
            />

            {/* Inspection Record Modal */}
            <InspectionRecordModal
                isOpen={inspectionModalOpen}
                onClose={() => setInspectionModalOpen(false)}
                business={business}
                rounds={rounds}
            />
        </AuthenticatedLayout>
    );
}
