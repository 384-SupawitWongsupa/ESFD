import React, { useState, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import {
    Printer, FileDown, ArrowLeft, FileText, Award,
    Pencil, RefreshCw, X, Check, CheckCircle2
} from 'lucide-react';

export default function DocumentPreview({
    business,
    owner,
    license,
    inspection,
    templateData = {},
    thaiIssueDate,
    thaiExpireDate,
}) {
    // แท็บเอกสารเริ่มต้น: แบบคำขอทางการ (app_template.pdf)
    const [activeDoc, setActiveDoc] = useState('app_template');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const iframeRef = useRef(null);

    // ข้อมูลเริ่มต้นสำหรับแบบคำขอ สธ.๒ (app_template.pdf)
    const [formData, setFormData] = useState({
        operation: templateData.business_operation || business.operation_type || business.category?.category_name || '',
        applicant_name: templateData.applicant_name || owner?.owner_name || '',
        age: templateData.age || '',
        nationality: templateData.nationality || 'ไทย',
        date_day: templateData.date_day || '',
        date_month: templateData.date_month || '',
        date_year: templateData.date_year || '',
        address_no: templateData.address_no || owner?.office_address || business.shop_address || '-',
        address_moo: templateData.address_moo || owner?.moo || business.shop_moo || '-',
        address_soi: templateData.address_soi || '-',
        address_road: templateData.address_road || '-',
        address_subdistrict: templateData.address_subdistrict || owner?.subdistrict || 'ดอยงาม',
        address_district: templateData.address_district || owner?.district || 'พาน',
        address_province: templateData.address_province || owner?.province || 'เชียงราย',
        phone: templateData.phone || owner?.phone || '',
        is_juristic: templateData.is_juristic || Boolean(owner?.juristic_id),
        request_no: templateData.request_no || business.request_no || '',
    });

    // Form Draft ชั่วคราวใน Modal แก้ไข
    const [draftData, setDraftData] = useState({ ...formData });

    // สร้าง URL สำหรับ PDF แบบคำขอที่ merge ข้อมูลลงใน app_template.pdf โดยตรง
    const appTemplatePdfUrl = useMemo(() => {
        const params = new URLSearchParams({
            operation: formData.operation,
            applicant_name: formData.applicant_name,
            age: formData.age,
            nationality: formData.nationality,
            date_day: formData.date_day,
            date_month: formData.date_month,
            date_year: formData.date_year,
            address_no: formData.address_no,
            address_moo: formData.address_moo,
            address_soi: formData.address_soi,
            address_road: formData.address_road,
            address_subdistrict: formData.address_subdistrict,
            address_district: formData.address_district,
            address_province: formData.address_province,
            phone: formData.phone,
            is_juristic: formData.is_juristic ? '1' : '0',
            request_no: formData.request_no,
            _t: String(Date.now()), // ป้องกัน browser cache
        });
        return `/documents/app-template/${business.business_id}/pdf?${params.toString()}`;
    }, [formData, business.business_id]);

    const aph2PdfUrl = `/documents/aph2/${business.business_id}/pdf?_t=${Date.now()}`;
    const currentPdfUrl = activeDoc === 'app_template' ? appTemplatePdfUrl : aph2PdfUrl;

    const handleOpenEditModal = () => {
        setDraftData({ ...formData });
        setIsEditModalOpen(true);
    };

    const handleSaveDraft = (e) => {
        e.preventDefault();
        setFormData({ ...draftData });
        setIsEditModalOpen(false);
    };

    // เมื่อกดปุ่ม "สั่งพิมพ์"
    const handlePrint = () => {
        setIsPrinting(true);

        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.focus();
                iframeRef.current.contentWindow.print();
            } else {
                window.open(currentPdfUrl, '_blank');
            }
        } catch (err) {
            window.open(currentPdfUrl, '_blank');
        }

        // เมื่อสั่งพิมพ์แล้ว นำทางกลับหน้ารายละเอียดสถานประกอบการ พร้อมแจ้งเตือนสำเร็จ
        setTimeout(() => {
            router.post(`/documents/after-print/${business.business_id}`, {
                doc_type: activeDoc,
            });
        }, 1200);
    };

    const handleReturnToBusiness = () => {
        router.post(`/documents/after-print/${business.business_id}`, {
            doc_type: activeDoc,
        });
    };

    return (
        <AuthenticatedLayout
            title="พิมพ์เอกสารราชการ"
            description="แบบฟอร์มคำขอรับใบอนุญาตทางการ (app_template.pdf) และใบอนุญาต อบต.ดอยงาม"
        >
            <Head title={`พิมพ์เอกสาร - ${business.shop_name || business.business_id}`} />

            {/* แถบเครื่องมือจัดการเอกสาร (Action Bar) */}
            <Card className="p-4 mb-5 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* ข้อมูลสถานประกอบการ & ปุ่มย้อนกลับ */}
                    <div className="flex items-center gap-3">
                        <Link href={`/businesses/${business.business_id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs font-normal text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>กลับหน้ารายละเอียด</span>
                            </Button>
                        </Link>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                {activeDoc === 'app_template'
                                    ? 'แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต (แบบฟอร์มทางการ app_template.pdf)'
                                    : 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๒)'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {business.shop_name || 'ไม่มีชื่อทางการค้า'} — ผู้ขอ: {owner?.owner_name}
                            </p>
                        </div>
                    </div>

                    {/* ปุ่มสลับเอกสาร และปุ่มพิมพ์ */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* แท็บสลับเอกสาร */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setActiveDoc('app_template')}
                                className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                                    activeDoc === 'app_template'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-normal'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>แบบคำขอ (app_template)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveDoc('aph2')}
                                className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                                    activeDoc === 'aph2'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-normal'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                <span>ใบอนุญาต (อภ.๒)</span>
                            </button>
                        </div>

                        {/* ปุ่มแก้ไขข้อมูล (เฉพาะแบบคำขอ) */}
                        {activeDoc === 'app_template' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleOpenEditModal}
                                className="h-9 px-3 text-xs font-normal text-emerald-800 border-emerald-300 hover:bg-emerald-50 rounded-xl flex items-center gap-1.5"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>แก้ไขข้อมูลในแบบฟอร์ม</span>
                            </Button>
                        )}

                        {/* ปุ่มสั่งพิมพ์ */}
                        <Button
                            type="button"
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal flex items-center gap-1.5 h-9 px-4 rounded-xl shadow-xs"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{isPrinting ? 'กำลังสั่งพิมพ์...' : 'สั่งพิมพ์เอกสาร'}</span>
                        </Button>

                        {/* ปุ่มดาวน์โหลดไฟล์ PDF ตัวจริง */}
                        <a
                            href={currentPdfUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-normal text-xs border border-slate-200 transition shadow-2xs"
                        >
                            <FileDown className="w-4 h-4" />
                            <span>ดาวน์โหลด PDF</span>
                        </a>

                        {/* ปุ่มเสร็จสิ้น / กลับหน้าร้าน */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReturnToBusiness}
                            className="h-9 px-3 text-xs font-normal text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl"
                        >
                            <span>เสร็จสิ้น / กลับ</span>
                        </Button>
                    </div>
                </div>

                {/* แถบแจ้งเตือนข้อมูลฟอร์มทางการ */}
                <div className="mt-3 flex items-center justify-between text-xs bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2 text-emerald-900">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                            ระบบใช้ไฟล์แบบฟอร์มทางการ <strong>app_template.pdf</strong> ในการกรอกข้อมูลและพิมพ์โดยตรง ตัวหนังสือและระยะบรรทัดถูกต้องตรงตามต้นฉบับ 100%
                        </span>
                    </div>
                    {activeDoc === 'app_template' && (
                        <button
                            type="button"
                            onClick={handleOpenEditModal}
                            className="text-emerald-800 hover:text-emerald-950 underline font-medium shrink-0 ml-2"
                        >
                            คลิกเพื่อแก้ไขข้อมูลก่อนพิมพ์
                        </button>
                    )}
                </div>
            </Card>

            {/* แสดงเอกสาร PDF ตัวจริงผ่าน Viewer โดยไม่สร้างฟอร์ม HTML จำลองขึ้นมาใหม่ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
                <iframe
                    ref={iframeRef}
                    key={currentPdfUrl}
                    src={currentPdfUrl}
                    title="Official Document PDF"
                    className="w-full h-[950px] rounded-xl border border-slate-200 bg-slate-50"
                />
            </div>

            {/* Modal สำหรับแก้ไขข้อมูลในแบบฟอร์ม app_template.pdf */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    แก้ไขข้อมูลในแบบคำขอรับใบอนุญาต (app_template.pdf)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    เมื่อแก้ไขแล้ว ข้อมูลจะถูกกรอกลงในไฟล์แบบฟอร์มทางการ app_template.pdf ทันทีโดยรูปแบบไม่เพี้ยน
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDraft} className="overflow-y-auto py-4 space-y-4 pr-1">
                            {/* ข้อมูลทั่วไป */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ลักษณะการประกอบกิจการ
                                    </label>
                                    <input
                                        type="text"
                                        value={draftData.operation}
                                        onChange={(e) => setDraftData({ ...draftData, operation: e.target.value })}
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                        placeholder="เช่น จำหน่ายอาหารและเครื่องดื่ม"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ชื่อผู้ขออนุญาต
                                    </label>
                                    <input
                                        type="text"
                                        value={draftData.applicant_name}
                                        onChange={(e) => setDraftData({ ...draftData, applicant_name: e.target.value })}
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            อายุ (ปี)
                                        </label>
                                        <input
                                            type="text"
                                            value={draftData.age}
                                            onChange={(e) => setDraftData({ ...draftData, age: e.target.value })}
                                            className="w-full text-sm rounded-xl border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                            placeholder="เช่น 45"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            สัญชาติ
                                        </label>
                                        <input
                                            type="text"
                                            value={draftData.nationality}
                                            onChange={(e) => setDraftData({ ...draftData, nationality: e.target.value })}
                                            className="w-full text-sm rounded-xl border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* วันที่เขียนคำขอ */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-800 mb-2">
                                    วันที่ยื่นคำขอ
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">วันที่</span>
                                        <input
                                            type="text"
                                            value={draftData.date_day}
                                            onChange={(e) => setDraftData({ ...draftData, date_day: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-3 focus:ring-2 focus:ring-emerald-700"
                                            placeholder="13"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">เดือน</span>
                                        <input
                                            type="text"
                                            value={draftData.date_month}
                                            onChange={(e) => setDraftData({ ...draftData, date_month: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-3 focus:ring-2 focus:ring-emerald-700"
                                            placeholder="พฤศจิกายน"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">พ.ศ.</span>
                                        <input
                                            type="text"
                                            value={draftData.date_year}
                                            onChange={(e) => setDraftData({ ...draftData, date_year: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-3 focus:ring-2 focus:ring-emerald-700"
                                            placeholder="2569"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ข้อมูลที่อยู่และเบอร์โทรศัพท์ */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-800">
                                    ที่อยู่ผู้ขออนุญาต
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">บ้านเลขที่</span>
                                        <input
                                            type="text"
                                            value={draftData.address_no}
                                            onChange={(e) => setDraftData({ ...draftData, address_no: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">หมู่ที่</span>
                                        <input
                                            type="text"
                                            value={draftData.address_moo}
                                            onChange={(e) => setDraftData({ ...draftData, address_moo: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">ตรอก/ซอย</span>
                                        <input
                                            type="text"
                                            value={draftData.address_soi}
                                            onChange={(e) => setDraftData({ ...draftData, address_soi: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">ถนน</span>
                                        <input
                                            type="text"
                                            value={draftData.address_road}
                                            onChange={(e) => setDraftData({ ...draftData, address_road: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>

                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">ตำบล</span>
                                        <input
                                            type="text"
                                            value={draftData.address_subdistrict}
                                            onChange={(e) => setDraftData({ ...draftData, address_subdistrict: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">อำเภอ</span>
                                        <input
                                            type="text"
                                            value={draftData.address_district}
                                            onChange={(e) => setDraftData({ ...draftData, address_district: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">จังหวัด</span>
                                        <input
                                            type="text"
                                            value={draftData.address_province}
                                            onChange={(e) => setDraftData({ ...draftData, address_province: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-1">หมายเลขโทรศัพท์</span>
                                        <input
                                            type="text"
                                            value={draftData.phone}
                                            onChange={(e) => setDraftData({ ...draftData, phone: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ประเภทผู้ขอ: บุคคลธรรมดา หรือ นิติบุคคล */}
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={draftData.is_juristic}
                                        onChange={(e) => setDraftData({ ...draftData, is_juristic: e.target.checked })}
                                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                                    />
                                    <span>ยื่นคำขอในนามนิติบุคคล (จะทำเครื่องหมาย / ในช่องหนังสือรับรองนิติบุคคล)</span>
                                </label>
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-xs font-normal"
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal flex items-center gap-1.5 px-5"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>บันทึกและอัปเดตแบบฟอร์ม PDF</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
