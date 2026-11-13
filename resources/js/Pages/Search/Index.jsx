import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import InspectionStatusBadge from '@/Components/InspectionStatusBadge';
import SmartCardModal from '@/Components/SmartCardModal';
import InspectionRecordModal from '@/Components/InspectionRecordModal';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { formatThaiDate, formatCitizenId, formatPhone } from '@/lib/utils';
import {
    CreditCard,
    Archive,
    Trash2,
    FileText,
    ClipboardCheck,
    Printer,
    CheckCircle2,
    FileDown,
    FileSignature,
    Eye,
    ExternalLink,
} from 'lucide-react';

export default function SearchIndex({ owners, rounds = [], filters }) {
    const [keyword, setKeyword] = useState(filters.q || '');
    const [smartCardModalOpen, setSmartCardModalOpen] = useState(false);
    const [selectedBusinessForInspection, setSelectedBusinessForInspection] = useState(null);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        id: null,
        type: '', // 'business' | 'owner'
        name: '',
        title: '',
        warningText: '',
        processing: false,
    });

    const handleSearch = (e) => {
        e?.preventDefault();
        router.get('/search', { q: keyword }, { preserveState: true, replace: true });
    };

    const handleClearSearch = () => {
        setKeyword('');
        router.get('/search', {}, { replace: true });
    };

    const handleCardDataReceived = (cardData) => {
        if (cardData?.citizen_id) {
            setKeyword(cardData.citizen_id);
            router.get('/search', { citizen_id: cardData.citizen_id });
        }
    };

    const handleIssueRequest = (businessId) => {
        router.post(`/businesses/${businessId}/issue-request`);
    };

    const handleMarkPrinted = (businessId) => {
        router.post(`/businesses/${businessId}/mark-printed`, {}, {
            preserveScroll: true,
        });
    };

    const handlePromptDeleteBusiness = (business) => {
        setDeleteModal({
            isOpen: true,
            id: business.business_id,
            type: 'business',
            name: business.shop_name || `สถานประกอบการ #${business.business_id}`,
            title: 'ยืนยันการลบสถานประกอบการ',
            warningText: 'ข้อมูลสถานประกอบการ ใบอนุญาต และประวัติการออกตรวจทั้งหมดของกิจการนี้จะถูกลบออกจากระบบอย่างถาวร',
            processing: false,
        });
    };

    const handlePromptDeleteOwner = (owner) => {
        setDeleteModal({
            isOpen: true,
            id: owner.owner_id,
            type: 'owner',
            name: owner.owner_name,
            title: 'ยืนยันการลบข้อมูลผู้ประกอบการ',
            warningText: `ข้อมูลของผู้ประกอบการรายนี้ และสถานประกอบการทั้งหมดในความครอบครอง (${owner.businesses?.length || 0} แห่ง) พร้อมใบอนุญาตทั้งหมดจะถูกลบออกจากระบบอย่างถาวร`,
            processing: false,
        });
    };

    const handleExecuteDelete = () => {
        setDeleteModal((prev) => ({ ...prev, processing: true }));

        const url = deleteModal.type === 'owner'
            ? `/owners/${deleteModal.id}`
            : `/businesses/${deleteModal.id}`;

        router.delete(url, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModal({ isOpen: false, id: null, type: '', name: '', title: '', warningText: '', processing: false });
            },
            onError: () => {
                setDeleteModal((prev) => ({ ...prev, processing: false }));
            },
            onFinish: () => {
                setDeleteModal((prev) => ({ ...prev, processing: false }));
            },
        });
    };

    return (
        <AuthenticatedLayout
            title="สืบค้นทะเบียนกิจการและผู้ประกอบการ"
            description="ค้นหาข้อมูลสถานประกอบการ หรืออ่านข้อมูลจากบัตรประจำตัวประชาชน"
        >
            <Head title="ค้นหาทะเบียนกิจการ" />

            {/* Top Search Card */}
            <Card className="p-5 mb-6 border-slate-200 shadow-xs">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="พิมพ์ค้นหา: ชื่อร้าน, ชื่อผู้ประกอบการ, เลขบัตร 13 หลัก, หมู่..."
                            className="block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-none transition text-slate-900 placeholder:text-slate-400 font-normal"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="submit"
                            variant="default"
                            className="h-10 px-5 bg-emerald-700 hover:bg-emerald-800 text-sm font-normal text-white transition rounded-xl"
                        >
                            ค้นหาข้อมูล
                        </Button>

                        <button
                            type="button"
                            onClick={() => setSmartCardModalOpen(true)}
                            title="อ่านบัตรประชาชน Smart Card"
                            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 transition border border-slate-700 shadow-xs shrink-0 flex items-center justify-center active:scale-95"
                        >
                            <CreditCard className="w-5 h-5" />
                        </button>

                        {(keyword || filters.citizen_id) && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClearSearch}
                                className="h-10 px-4 text-sm font-normal text-slate-600 border-slate-300 hover:bg-slate-50 rounded-xl"
                            >
                                ล้างค้นหา
                            </Button>
                        )}
                    </div>
                </form>

                {filters.citizen_id && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-normal">
                        ผลการค้นหาจากรหัสบัตรประชาชน: <span className="font-normal text-sm ml-1">{formatCitizenId(filters.citizen_id)}</span>
                    </div>
                )}
            </Card>

            {/* Grouped Owner Cards */}
            <div className="space-y-6">
                {owners.data && owners.data.length > 0 ? (
                    owners.data.map((owner) => (
                        <div
                            key={owner.owner_id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                        >
                            {/* ส่วนข้อมูลผู้ประกอบการ (Owner Header) */}
                            <div className="bg-slate-50/70 p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h3 className="text-base font-bold text-slate-900">
                                            {owner.owner_name}
                                        </h3>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            {owner.businesses?.length || 0} สถานประกอบการ
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-normal">
                                        <span>
                                            เลขบัตร: <span className="text-slate-900">{formatCitizenId(owner.citizen_id) || owner.juristic_id || '-'}</span>
                                        </span>
                                        <span>
                                            โทร: <span className="text-slate-900">{formatPhone(owner.phone) || '-'}</span>
                                        </span>
                                        <span>
                                            ที่อยู่: <span className="text-slate-900">
                                                {owner.office_address ? `เลขที่ ${owner.office_address}` : ''}
                                                {owner.moo ? ` หมู่ ${owner.moo}` : ''}
                                                {owner.subdistrict ? ` ต.${owner.subdistrict}` : ''}
                                                {owner.district ? ` อ.${owner.district}` : ''}
                                                {owner.province ? ` จ.${owner.province}` : ''}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* ปุ่มดาวน์โหลดไฟล์รวม ZIP และปุ่มลบ (Icon Buttons) */}
                                <div className="shrink-0 flex items-center gap-2">
                                    <a
                                        href={`/documents/batch-zip/${owner.owner_id}`}
                                        title="ดาวน์โหลดทุกใบคำขอและใบอนุญาต (.ZIP)"
                                        className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs inline-flex items-center justify-center"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => handlePromptDeleteOwner(owner)}
                                        title="ลบข้อมูลผู้ประกอบการนี้และสถานประกอบการทั้งหมด"
                                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition inline-flex items-center justify-center"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* รายการสถานประกอบการของเจ้าของรายนี้ */}
                            <div className="p-5 space-y-4">
                                {owner.businesses?.map((b) => {
                                    const latestLic = b.licenses?.[0];
                                    const latestInsp = b.inspectionRecords?.[0];

                                    return (
                                        <div
                                            key={b.business_id}
                                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition"
                                        >
                                            {/* Header แถบชื่อร้านและสถานะ */}
                                            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 mb-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-sm font-bold text-slate-900">
                                                        {b.shop_name || 'ไม่มีชื่อทางการค้า'}
                                                    </h4>
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-normal border border-slate-200">
                                                        {b.category?.category_name}
                                                    </span>
                                                    <InspectionStatusBadge
                                                        status={b.inspection_status}
                                                        workflowStatus={b.workflow_status}
                                                    />
                                                    <StatusBadge
                                                        status={latestLic?.status}
                                                        expireDate={latestLic?.expire_date}
                                                    />
                                                </div>

                                                <div className="text-xs text-slate-500 font-normal">
                                                    รหัส: #{b.business_id}
                                                </div>
                                            </div>

                                            {/* ข้อมูลรายละเอียดสถานประกอบการ */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 font-normal mb-3">
                                                <div>
                                                    <span className="text-slate-400 block mb-0.5">ที่ตั้งและกิจการ:</span>
                                                    <span className="text-slate-900 block font-normal">
                                                        {b.operation_type || '-'}
                                                    </span>
                                                    <span className="text-slate-600 block mt-0.5">
                                                        เลขที่ {b.shop_address || '-'} หมู่ {b.shop_moo || '-'} ต.ดอยงาม
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-slate-400 block mb-0.5">กายภาพ:</span>
                                                    <div className="text-slate-700 space-y-0.5">
                                                        <div>พื้นที่: {b.business_area || '-'} ตร.ม.</div>
                                                        <div>กำลังเครื่องจักร: {b.machine_power || '-'} แรงม้า</div>
                                                        <div>คนงาน: {b.worker_count || '-'} คน</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-slate-400 block mb-0.5">ใบอนุญาต:</span>
                                                    {latestLic ? (
                                                        <div className="text-slate-700 space-y-0.5">
                                                            <div>เล่ม/เลขที่: <span className="text-slate-900">{latestLic.receipt_book || '-'}/{latestLic.receipt_no || '-'}</span></div>
                                                            <div>สิ้นอายุ: <span className="text-slate-900">{formatThaiDate(latestLic.expire_date)}</span></div>
                                                            <div>ค่าธรรมเนียม: <span>{Number(latestLic.fee || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span></div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">ยังไม่มีใบอนุญาต</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* แถบปุ่มดำเนินการ (Icon Buttons พร้อม Tooltip) */}
                                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
                                                <div>
                                                    {latestInsp?.file_url ? (
                                                        <a
                                                            href={latestInsp.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-normal underline"
                                                        >
                                                            <span>เอกสารตรวจแนบ</span>
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {/* ขั้นตอนที่ ๑: ออกใบคำขอ สธ.๒ (แสดงเมื่อรอออกใบคำขอ) */}
                                                    {b.workflow_status === 'pending_request' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleIssueRequest(b.business_id)}
                                                                title="กดออกใบคำขอเพื่อเข้าสู่ขั้นตอนรอออกตรวจ"
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-normal text-xs transition shadow-2xs"
                                                            >
                                                                <FileText className="w-3.5 h-3.5" />
                                                                <span>กดออกใบคำขอ</span>
                                                            </button>

                                                            <a
                                                                href={`/documents/sth2/${b.business_id}/pdf`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title="พิมพ์แบบคำขอ (สธ.๒)"
                                                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </a>
                                                        </>
                                                    )}

                                                    {/* ขั้นตอนที่ ๒: บันทึกผลการออกตรวจ (แสดงเมื่อออกใบคำขอแล้ว -> รอออกตรวจ) */}
                                                    {b.workflow_status === 'pending_inspection' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedBusinessForInspection(b)}
                                                            title="บันทึกผลการออกตรวจสุขลักษณะ และกรอกข้อมูลใบเสร็จ"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-normal text-xs transition shadow-2xs"
                                                        >
                                                            <ClipboardCheck className="w-3.5 h-3.5" />
                                                            <span>บันทึกผลตรวจ</span>
                                                        </button>
                                                    )}

                                                    {/* พิมพ์ใบอนุญาต อภ.๒ */}
                                                    {(b.workflow_status === 'pending_print' || b.workflow_status === 'completed' || b.inspectionRecords?.length > 0) && (
                                                        <Link
                                                            href={`/documents/preview/${b.business_id}`}
                                                            title="พิมพ์ใบอนุญาต (อภ.๒)"
                                                            className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-2xs"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </Link>
                                                    )}

                                                    {/* ทำเครื่องหมายพิมพ์แล้ว */}
                                                    {b.workflow_status === 'pending_print' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMarkPrinted(b.business_id)}
                                                            title="ทำเครื่องหมายพิมพ์แล้ว"
                                                            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* ดาวน์โหลด Word (.docx) */}
                                                    <a
                                                        href={`/documents/aph2/${b.business_id}/word`}
                                                        title="ดาวน์โหลด Word (.docx)"
                                                        className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs"
                                                    >
                                                        <FileDown className="w-4 h-4" />
                                                    </a>

                                                    {/* แบบคำขอ สธ.๒ (PDF) */}
                                                    <a
                                                        href={`/documents/sth2/${b.business_id}/pdf`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title="แบบคำขอ สธ.๒ (PDF)"
                                                        className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs"
                                                    >
                                                        <FileSignature className="w-4 h-4" />
                                                    </a>

                                                    {/* รายละเอียดสถานประกอบการ */}
                                                    <Link
                                                        href={`/businesses/${b.business_id}`}
                                                        title="รายละเอียดสถานประกอบการ"
                                                        className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>

                                                    {/* ลบสถานประกอบการ */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePromptDeleteBusiness(b)}
                                                        title="ลบสถานประกอบการนี้"
                                                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <Card className="p-12 text-center text-slate-500 border-slate-200">
                        <p className="text-base font-bold text-slate-700">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                        <p className="text-xs text-slate-400 mt-1">โปรดตรวจสอบคำค้นหา หรือใช้ระบบอ่านบัตรประจำตัวประชาชน</p>
                    </Card>
                )}

                <Pagination links={owners.links} />
            </div>

            {/* Smart Card Modal */}
            <SmartCardModal
                isOpen={smartCardModalOpen}
                onClose={() => setSmartCardModalOpen(false)}
                onCardDataReceived={handleCardDataReceived}
                mode="search"
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={handleExecuteDelete}
                title={deleteModal.title}
                itemName={deleteModal.name}
                itemType={deleteModal.type === 'owner' ? 'ผู้ประกอบการ' : 'สถานประกอบการ'}
                warningText={deleteModal.warningText}
                processing={deleteModal.processing}
            />

            {/* Inspection Record Modal */}
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
