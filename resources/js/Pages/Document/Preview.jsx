import React, { useState, useMemo, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import {
    Printer, FileDown, ArrowLeft, FileText, Award,
    Check, CheckCircle2, RotateCcw, Eye, Sparkles, AlertCircle
} from 'lucide-react';

export default function DocumentPreview({
    business,
    owner,
    license,
    inspection,
    templateData = {},
    aph2Data = {},
    thaiIssueDate,
    thaiExpireDate,
    initialTab,
    initialForm,
}) {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tabParam = urlParams?.get('tab') || initialTab;
    const formParam = urlParams?.get('form') || initialForm;

    const [activeTab, setActiveTab] = useState(
        (tabParam === 'pdf_preview' || tabParam === 'aph1') ? 'pdf_preview' : (tabParam === 'aph2' ? 'aph2' : 'interactive_form')
    );
    const [selectedForm, setSelectedForm] = useState(formParam === 'aph2' ? 'aph2' : 'aph1');
    const [isPrinting, setIsPrinting] = useState(false);
    const iframeRef = useRef(null);

    // ==========================================
    // ๑. ค่าเริ่มต้นและฟอร์มสำหรับ แบบ อภ.๑ (แบบคำขอ)
    // ==========================================
    const isJuristicDefault = Boolean(templateData.is_juristic || owner?.juristic_id);
    const initialOperation = templateData.business_operation || 
        (business.shop_name ? `${business.shop_name} (${business.operation_type || business.category?.category_name || ''})` : (business.operation_type || business.category?.category_name || ''));

    const [form, setForm] = useState({
        operation: initialOperation,
        written_at: templateData.written_at || 'อบต.ดอยงาม',
        date_day: templateData.date_day || '',
        date_month: templateData.date_month || '',
        date_year: templateData.date_year || '',
        applicant_name: templateData.applicant_name || owner?.owner_name || '',
        age: templateData.age || '',
        nationality: templateData.nationality || 'ไทย',
        juristic_rep: templateData.juristic_rep || (isJuristicDefault ? (owner?.owner_name || '') : ''),
        address_no: templateData.address_no || owner?.office_address || business.shop_address || '-',
        address_moo: templateData.address_moo || owner?.moo || business.shop_moo || '-',
        address_soi: templateData.address_soi || '-',
        address_road: templateData.address_road || '-',
        address_subdistrict: templateData.address_subdistrict || owner?.subdistrict || 'ดอยงาม',
        address_district: templateData.address_district || owner?.district || 'พาน',
        address_province: templateData.address_province || owner?.province || 'เชียงราย',
        phone: templateData.phone || owner?.phone || '',
        request_no: templateData.request_no || business.request_no || '',

        // ตัวเลือกการติ๊กถูกเองในข้อ ๒ (เอกสารแนบ)
        chk_1: !isJuristicDefault, // สำเนาบัตรประจำตัวประชาชน
        chk_2: false,              // สำเนาใบอนุญาตเดิม
        chk_3: false,              // รายงาน EIA
        chk_4: false,              // ใบมอบอำนาจ
        chk_5: isJuristicDefault,  // สำเนาหนังสือรับรองนิติบุคคล
        chk_6: false,              // หลักฐานอำนาจลงนามแทนนิติบุคคล
        chk_7: false,              // เอกสารและหลักฐานอื่นๆ
    });

    // ==========================================
    // ๒. ค่าเริ่มต้นและฟอร์มสำหรับ แบบ อภ.๒ (ใบอนุญาต)
    // ==========================================
    const [aph2Form, setAph2Form] = useState({
        // ช่องเล่มที่: ค่าเริ่มต้นเว้นว่างเพื่อให้เจ้าหน้าที่กรอกแทนตามคำขอ
        receipt_book: aph2Data.receipt_book ?? '',
        receipt_no: aph2Data.receipt_no ?? '',
        license_year: aph2Data.license_year ?? '',
        owner_name: aph2Data.owner_name ?? (owner?.owner_name || ''),
        nationality: aph2Data.nationality ?? 'ไทย',
        office_address: aph2Data.office_address ?? (owner?.office_address || business.shop_address || ''),
        moo: aph2Data.moo ?? (owner?.moo || business.shop_moo || ''),
        subdistrict: aph2Data.subdistrict ?? (owner?.subdistrict || 'ดอยงาม'),
        district: aph2Data.district ?? (owner?.district || 'พาน'),
        province: aph2Data.province ?? (owner?.province || 'เชียงราย'),
        id_card_or_juristic: aph2Data.id_card_or_juristic ?? (owner?.citizen_id || owner?.juristic_id || ''),
        phone: aph2Data.phone ?? (owner?.phone || ''),
        shop_name: aph2Data.shop_name ?? (business.shop_name || ''),
        operation_type: aph2Data.operation_type ?? (business.operation_type || business.category?.category_name || ''),
        shop_address: aph2Data.shop_address ?? (business.shop_address || ''),
        shop_moo: aph2Data.shop_moo ?? (business.shop_moo || ''),
        shop_subdistrict: aph2Data.shop_subdistrict ?? 'ดอยงาม',
        shop_district: aph2Data.shop_district ?? 'พาน',
        shop_province: aph2Data.shop_province ?? 'เชียงราย',
        shop_phone: aph2Data.shop_phone ?? (business.shop_phone || owner?.phone || ''),
        fee: aph2Data.fee ?? (license ? String(license.fee) : '0'),
        fee_text: aph2Data.fee_text ?? '',
        receipt_info: aph2Data.receipt_info ?? '',
        receipt_date: aph2Data.receipt_date ?? '',
        condition_4_3: aph2Data.condition_4_3 ?? '',
        condition_4_4: aph2Data.condition_4_4 ?? '',
        issue_day: aph2Data.issue_day ?? '',
        issue_month: aph2Data.issue_month ?? '',
        issue_year: aph2Data.issue_year ?? '',
        expire_day: aph2Data.expire_day ?? '',
        expire_month: aph2Data.expire_month ?? '',
        expire_year: aph2Data.expire_year ?? '',
    });

    // ตรวจสอบสถานะเงื่อนไขพิเศษของ อภ.๒ เพื่อแสดงแม่แบบที่จะถูกใช้งานอัตโนมัติ
    const cond3Trimmed = (aph2Form.condition_4_3 || '').trim();
    const cond4Trimmed = (aph2Form.condition_4_4 || '').trim();
    const hasCond3 = Boolean(cond3Trimmed && !['ไม่มี', '-', 'ไม่มีเงื่อนไข'].includes(cond3Trimmed));
    const hasCond4 = Boolean(cond4Trimmed && !['ไม่มี', '-', 'ไม่มีเงื่อนไข'].includes(cond4Trimmed));
    const aph2TemplateInfo = useMemo(() => {
        if (hasCond3 && hasCond4) {
            return {
                name: 'template4.4.pdf',
                title: 'มีเงื่อนไขพิเศษ ๒ ข้อ (๔.๓ และ ๔.๔)',
                color: 'bg-purple-50 text-purple-800 border-purple-200'
            };
        } else if (hasCond3 || hasCond4) {
            return {
                name: 'template4.3.pdf',
                title: 'มีเงื่อนไขพิเศษ ๑ ข้อ (๔.๓)',
                color: 'bg-amber-50 text-amber-800 border-amber-200'
            };
        } else {
            return {
                name: 'template.pdf',
                title: 'แม่แบบมาตรฐาน (ไม่มีเงื่อนไขพิเศษเพิ่มเติม)',
                color: 'bg-blue-50 text-blue-800 border-blue-200'
            };
        }
    }, [hasCond3, hasCond4]);

    // สร้าง URL สำหรับ PDF แบบ อภ.๑ ที่กรอกทับ app_template.pdf
    const appTemplatePdfUrl = useMemo(() => {
        const params = new URLSearchParams({
            operation: form.operation,
            applicant_name: form.applicant_name,
            age: form.age,
            nationality: form.nationality,
            juristic_rep: form.juristic_rep,
            date_day: form.date_day,
            date_month: form.date_month,
            date_year: form.date_year,
            address_no: form.address_no,
            address_moo: form.address_moo,
            address_soi: form.address_soi,
            address_road: form.address_road,
            address_subdistrict: form.address_subdistrict,
            address_district: form.address_district,
            address_province: form.address_province,
            phone: form.phone,
            is_juristic: form.chk_5 ? '1' : '0',
            request_no: form.request_no,
            chk_1: form.chk_1 ? '1' : '0',
            chk_2: form.chk_2 ? '1' : '0',
            chk_3: form.chk_3 ? '1' : '0',
            chk_4: form.chk_4 ? '1' : '0',
            chk_5: form.chk_5 ? '1' : '0',
            chk_6: form.chk_6 ? '1' : '0',
            chk_7: form.chk_7 ? '1' : '0',
            _t: String(Date.now()),
        });
        return `/documents/app-template/${business.business_id}/pdf?${params.toString()}`;
    }, [form, business.business_id]);

    // สร้าง URL สำหรับ PDF แบบ อภ.๒ ตามข้อมูลที่กรอกในฟอร์มแบบเรียลไทม์
    const aph2PdfUrl = useMemo(() => {
        const params = new URLSearchParams({
            receipt_book: aph2Form.receipt_book,
            receipt_no: aph2Form.receipt_no,
            license_year: aph2Form.license_year,
            owner_name: aph2Form.owner_name,
            nationality: aph2Form.nationality,
            office_address: aph2Form.office_address,
            moo: aph2Form.moo,
            subdistrict: aph2Form.subdistrict,
            district: aph2Form.district,
            province: aph2Form.province,
            id_card_or_juristic: aph2Form.id_card_or_juristic,
            phone: aph2Form.phone,
            shop_name: aph2Form.shop_name,
            operation_type: aph2Form.operation_type,
            shop_address: aph2Form.shop_address,
            shop_moo: aph2Form.shop_moo,
            shop_subdistrict: aph2Form.shop_subdistrict,
            shop_district: aph2Form.shop_district,
            shop_province: aph2Form.shop_province,
            shop_phone: aph2Form.shop_phone,
            fee: aph2Form.fee,
            fee_text: aph2Form.fee_text,
            receipt_info: aph2Form.receipt_info,
            receipt_date: aph2Form.receipt_date,
            condition_4_3: aph2Form.condition_4_3,
            condition_4_4: aph2Form.condition_4_4,
            issue_day: aph2Form.issue_day,
            issue_month: aph2Form.issue_month,
            issue_year: aph2Form.issue_year,
            expire_day: aph2Form.expire_day,
            expire_month: aph2Form.expire_month,
            expire_year: aph2Form.expire_year,
            _t: String(Date.now()),
        });
        return `/documents/aph2/${business.business_id}/pdf?${params.toString()}`;
    }, [aph2Form, business.business_id]);

    // กำหนด URL ของ PDF ตามแท็บที่เลือกใช้งาน
    const currentPdfUrl = useMemo(() => {
        if (activeTab === 'interactive_form') {
            return selectedForm === 'aph2' ? aph2PdfUrl : appTemplatePdfUrl;
        }
        return activeTab === 'aph2' ? aph2PdfUrl : appTemplatePdfUrl;
    }, [activeTab, selectedForm, aph2PdfUrl, appTemplatePdfUrl]);

    // สั่งพิมพ์เอกสารทางการ
    const fromParam = urlParams?.get('from') || '';

    const handlePrint = () => {
        setIsPrinting(true);
        const printWindow = window.open(currentPdfUrl, '_blank');
        if (printWindow) {
            printWindow.focus();
        }

        setTimeout(() => {
            router.post(`/documents/after-print/${business.business_id}`, {
                doc_type: (activeTab === 'aph2' || (activeTab === 'interactive_form' && selectedForm === 'aph2')) ? 'aph2' : 'app_template',
                from: fromParam,
            });
        }, 1200);
    };

    const handleReturn = () => {
        router.post(`/documents/after-print/${business.business_id}`, {
            doc_type: (activeTab === 'aph2' || (activeTab === 'interactive_form' && selectedForm === 'aph2')) ? 'aph2' : 'app_template',
            from: fromParam,
        });
    };

    return (
        <AuthenticatedLayout
            title="พิมพ์เอกสารราชการ"
            description="กรอกข้อมูลลงในแบบฟอร์มทางการ (อภ.๑ และ อภ.๒) และสั่งพิมพ์ อบต.ดอยงาม"
        >
            <Head title={`พิมพ์เอกสาร - ${business.shop_name || business.business_id}`} />

            {/* แถบเครื่องมือด้านบน (Action Bar) */}
            <Card className="p-4 mb-5 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={fromParam === 'pending-print' ? '/pending-print' : `/businesses/${business.business_id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs font-normal text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>{fromParam === 'pending-print' ? 'กลับหน้าสถานะกิจการ' : 'กลับหน้ารายละเอียดร้าน'}</span>
                            </Button>
                        </Link>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                {activeTab === 'interactive_form'
                                    ? (selectedForm === 'aph2'
                                        ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๒)'
                                        : 'แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต (แบบ อภ.๑)')
                                    : (activeTab === 'aph2'
                                        ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๒)'
                                        : 'พรีวิว PDF แบบคำขอรับใบอนุญาต (แบบ อภ.๑)')}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                กิจการ: <strong className="text-slate-800">{business.shop_name || 'ไม่มีชื่อร้าน'}</strong> — เจ้าของ: <strong className="text-slate-800">{owner?.owner_name}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* แท็บสลับโหมดหลัก */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setActiveTab('interactive_form')}
                                className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                                    activeTab === 'interactive_form'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-normal'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>กรอกข้อมูลในแบบฟอร์ม</span>
                            </button>

                            {/* เปลี่ยนชื่อเป็น พรีวิว PDF (อภ.๑) ตามคำขอ */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('pdf_preview')}
                                className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                                    activeTab === 'pdf_preview'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-normal'
                                }`}
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span>พรีวิว PDF (อภ.๑)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('aph2')}
                                className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                                    activeTab === 'aph2'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-normal'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                <span>ใบอนุญาต (อภ.๒)</span>
                            </button>
                        </div>

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

                        {/* ปุ่มดาวน์โหลด PDF ตัวจริง */}
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

                        {/* ปุ่มเสร็จสิ้น / กลับ */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReturn}
                            className="h-9 px-3 text-xs font-normal text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl"
                        >
                            <span>เสร็จสิ้น / กลับ</span>
                        </Button>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2 text-emerald-900">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                            ระบบดึงข้อมูลกิจการและเจ้าของกิจการมาใส่ในแบบฟอร์มให้เรียบร้อยแล้ว สามารถสลับกรอกแก้ไขได้ทั้งแบบ <strong>อภ.๑ (ใบคำขอ)</strong> และ <strong>อภ.๒ (ใบอนุญาต)</strong>
                        </span>
                    </div>
                </div>
            </Card>

            {/* โหมดที่ ๑: แบบฟอร์มกรอกข้อมูลลงในแบบฟอร์มโดยตรง (Interactive In-Place Form) */}
            {activeTab === 'interactive_form' && (
                <div className="space-y-4">
                    {/* ตัวเลือกสลับระหว่างแบบ อภ.๑ และ อภ.๒ ตามคำขอของผู้ใช้ */}
                    <div className="flex items-center justify-center">
                        <div className="inline-flex rounded-2xl bg-white p-1.5 border border-slate-200 shadow-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedForm('aph1')}
                                className={`px-5 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 ${
                                    selectedForm === 'aph1'
                                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>แบบ อภ.๑ (แบบคำขอรับใบอนุญาต)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedForm('aph2')}
                                className={`px-5 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 ${
                                    selectedForm === 'aph2'
                                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                                }`}
                            >
                                <Award className="w-4 h-4" />
                                <span>แบบ อภ.๒ (ใบอนุญาตประกอบกิจการ)</span>
                            </button>
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* แสดงแบบฟอร์มกรอก อภ.๑ (แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต) */}
                    {/* ======================================================== */}
                    {selectedForm === 'aph1' && (
                        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-8 sm:p-14 max-w-4xl mx-auto text-slate-900 leading-relaxed font-['THSarabunNew',serif] text-[16px]">
                            {/* กล่องคำขอเลขที่ */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="border border-slate-800 p-2.5 w-48 text-center text-sm leading-tight rounded-md bg-slate-50/50">
                                    <div className="flex items-center justify-center gap-1">
                                        <span>คำขอเลขที่:</span>
                                        <input
                                            type="text"
                                            value={form.request_no}
                                            onChange={(e) => setForm({ ...form, request_no: e.target.value })}
                                            className="w-20 text-center font-semibold bg-transparent border-b border-dotted border-slate-800 outline-none text-xs"
                                            placeholder=".........../..........."
                                        />
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">(เจ้าหน้าที่กรอก)</div>
                                </div>
                            </div>

                            {/* หัวเรื่องแบบฟอร์ม */}
                            <div className="text-center font-bold text-lg mb-4 tracking-tight">
                                แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต
                            </div>

                            {/* ประกอบกิจการ */}
                            <div className="text-center text-base mb-6 flex items-center justify-center gap-2 flex-wrap">
                                <span className="font-medium shrink-0">ประกอบกิจการ:</span>
                                <input
                                    type="text"
                                    value={form.operation}
                                    onChange={(e) => setForm({ ...form, operation: e.target.value })}
                                    className="font-semibold text-slate-900 border-b border-dotted border-slate-800 outline-none px-2 py-0.5 text-center min-w-[320px] max-w-full focus:bg-emerald-50 focus:border-emerald-600 transition"
                                    placeholder="พิมพ์ชื่อกิจการและลักษณะกิจการ"
                                />
                            </div>

                            {/* เขียนที่ และ วันที่ (ชิดขวา) */}
                            <div className="flex justify-end mb-6">
                                <div className="w-96 text-left space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0">เขียนที่:</span>
                                        <input
                                            type="text"
                                            value={form.written_at}
                                            onChange={(e) => setForm({ ...form, written_at: e.target.value })}
                                            className="font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 w-48 focus:bg-emerald-50 focus:border-emerald-600 transition"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="shrink-0">วันที่:</span>
                                        <input
                                            type="text"
                                            value={form.date_day}
                                            onChange={(e) => setForm({ ...form, date_day: e.target.value })}
                                            className="w-12 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50 focus:border-emerald-600"
                                            placeholder="๑๓"
                                        />
                                        <span className="shrink-0">เดือน:</span>
                                        <input
                                            type="text"
                                            value={form.date_month}
                                            onChange={(e) => setForm({ ...form, date_month: e.target.value })}
                                            className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50 focus:border-emerald-600"
                                            placeholder="พฤศจิกายน"
                                        />
                                        <span className="shrink-0">พ.ศ.:</span>
                                        <input
                                            type="text"
                                            value={form.date_year}
                                            onChange={(e) => setForm({ ...form, date_year: e.target.value })}
                                            className="w-16 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50 focus:border-emerald-600"
                                            placeholder="๒๕๖๙"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ข้อ ๑ รายละเอียดผู้ขออนุญาต */}
                            <div className="space-y-4 text-justify leading-loose mb-6">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="indent-10">๑. ข้าพเจ้า:</span>
                                    <input
                                        type="text"
                                        value={form.applicant_name}
                                        onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
                                        className="font-semibold text-slate-900 border-b border-dotted border-slate-800 outline-none px-2 py-0.5 w-64 focus:bg-emerald-50 focus:border-emerald-600 transition"
                                        placeholder="พิมพ์ชื่อ-นามสกุล เจ้าของกิจการ"
                                    />
                                    <span>อายุ:</span>
                                    <input
                                        type="text"
                                        value={form.age}
                                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                                        className="w-14 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50 focus:border-emerald-600"
                                        placeholder="ปี"
                                    />
                                    <span>ปี</span>
                                    <span>สัญชาติ:</span>
                                    <input
                                        type="text"
                                        value={form.nationality}
                                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                                        className="w-20 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50 focus:border-emerald-600"
                                    />
                                </div>

                                {/* ช่องลงชื่อผู้มีอำนาจลงนามแทนนิติบุคคล (พิมพ์ได้เลย) */}
                                <div className="flex items-center gap-2 flex-wrap bg-emerald-50/40 p-2.5 rounded-xl border border-dashed border-emerald-300">
                                    <span>โดย:</span>
                                    <input
                                        type="text"
                                        value={form.juristic_rep}
                                        onChange={(e) => setForm({ ...form, juristic_rep: e.target.value })}
                                        className="font-semibold text-slate-900 border-b border-dotted border-slate-800 outline-none px-2 py-0.5 flex-1 min-w-[200px] focus:bg-white focus:border-emerald-600 transition"
                                        placeholder="พิมพ์ชื่อผู้มีอำนาจลงนามแทนนิติบุคคล (ถ้ามี)"
                                    />
                                    <span className="text-slate-800 font-medium">ผู้มีอำนาจลงนามแทนนิติบุคคล</span>
                                </div>

                                {/* ที่อยู่ */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>ปรากฏตาม................ที่อยู่เลขที่:</span>
                                    <input
                                        type="text"
                                        value={form.address_no}
                                        onChange={(e) => setForm({ ...form, address_no: e.target.value })}
                                        className="w-20 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>หมู่ที่:</span>
                                    <input
                                        type="text"
                                        value={form.address_moo}
                                        onChange={(e) => setForm({ ...form, address_moo: e.target.value })}
                                        className="w-14 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>ตรอก/ซอย:</span>
                                    <input
                                        type="text"
                                        value={form.address_soi}
                                        onChange={(e) => setForm({ ...form, address_soi: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>ถนน:</span>
                                    <input
                                        type="text"
                                        value={form.address_road}
                                        onChange={(e) => setForm({ ...form, address_road: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>แขวง/ตำบล:</span>
                                    <input
                                        type="text"
                                        value={form.address_subdistrict}
                                        onChange={(e) => setForm({ ...form, address_subdistrict: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>เขต/อำเภอ:</span>
                                    <input
                                        type="text"
                                        value={form.address_district}
                                        onChange={(e) => setForm({ ...form, address_district: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>จังหวัด:</span>
                                    <input
                                        type="text"
                                        value={form.address_province}
                                        onChange={(e) => setForm({ ...form, address_province: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>หมายเลขโทรศัพท์:</span>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-48 font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50"
                                        placeholder="๐๘x-xxx-xxxx"
                                    />
                                    <span>ผู้ขออนุญาต</span>
                                </div>
                            </div>

                            {/* ข้อ ๒ เอกสารหลักฐาน (เลือกติ๊กถูกเองได้ทุกข้อ) */}
                            <div className="space-y-3 mb-8 pt-2">
                                <div className="font-medium text-slate-900">
                                    ๒. พร้อมคำขอนี้ ข้าพเจ้าได้แนบเอกสารหลักฐานต่าง ๆ มาด้วยแล้ว ดังนี้ (คลิกเพื่อเลือกติ๊กถูกเอง):
                                </div>
                                <div className="pl-6 space-y-2.5 text-sm">
                                    {[
                                        { key: 'chk_1', label: 'สำเนาบัตรประจำตัว (ประชาชน/ข้าราชการ/พนักงานรัฐวิสาหกิจ/อื่น ๆ ระบุ ............................................)' },
                                        { key: 'chk_2', label: 'สำเนาใบอนุญาตตามกฎหมายที่เกี่ยวข้อง ได้แก่ ..........................................................................................' },
                                        { key: 'chk_3', label: 'หนังสือให้ความเห็นชอบการประเมินผลกระทบต่อสิ่งแวดล้อม' },
                                        { key: 'chk_4', label: 'ใบมอบอำนาจ (ในกรณีที่มีการมอบอำนาจ)' },
                                        { key: 'chk_5', label: 'สำเนาหนังสือรับรองการจดทะเบียนเป็นนิติบุคคล' },
                                        { key: 'chk_6', label: 'หลักฐานที่แสดงการเป็นผู้มีอำนาจลงนามแทนนิติบุคคล' },
                                        { key: 'chk_7', label: 'เอกสารและหลักฐานอื่น ๆ ตามที่ราชการส่วนท้องถิ่นประกาศกำหนด' },
                                    ].map(({ key, label }) => (
                                        <label
                                            key={key}
                                            className="flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form[key]}
                                                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                                                className="mt-0.5 rounded border-slate-400 text-emerald-700 focus:ring-emerald-600 w-4 h-4"
                                            />
                                            <span className="select-none font-mono text-sm font-bold text-emerald-800">
                                                {form[key] ? '[ / ]' : '[   ]'}
                                            </span>
                                            <span className="text-slate-800">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* รับรองและลายเซ็นท้ายเอกสาร */}
                            <div className="space-y-6 pt-4 border-t border-slate-200">
                                <p>ขอรับรองว่า ข้อความในคำขอนี้เป็นความจริงทุกประการ</p>
                                <div className="float-right text-center w-80 space-y-3">
                                    <div>(ลงชื่อ)............................................................ ผู้ขออนุญาต</div>
                                    <div className="text-slate-800 font-semibold">
                                        ( {form.applicant_name || '............................................................'} )
                                    </div>
                                </div>
                                <div className="clear-both" />
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* แสดงแบบฟอร์มกรอก อภ.๒ (ใบอนุญาตประกอบกิจการที่เป็นอันตรายฯ) */}
                    {/* ======================================================== */}
                    {selectedForm === 'aph2' && (
                        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-8 sm:p-14 max-w-4xl mx-auto text-slate-900 leading-relaxed font-['THSarabunNew',serif] text-[16px]">
                            {/* แถบแจ้งเตือนสถานะแม่แบบที่เลือกใช้งานตามเงื่อนไข */}
                            <div className={`mb-6 p-3 rounded-xl border flex items-center justify-between text-xs font-sans ${aph2TemplateInfo.color}`}>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 shrink-0" />
                                    <span>
                                        <strong>ระบบเลือกแม่แบบอัตโนมัติ:</strong> {aph2TemplateInfo.name} ({aph2TemplateInfo.title})
                                    </span>
                                </div>
                                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/70 border border-current">
                                    Template Dynamic Switch
                                </span>
                            </div>

                            {/* เล่มที่, เลขที่, ปี (มุมซ้ายบน) */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3 text-sm flex-wrap">
                                    <div className="flex items-center gap-1 bg-amber-50/70 p-1.5 px-2.5 rounded-lg border border-amber-300">
                                        <span className="font-semibold text-amber-900">เล่มที่:</span>
                                        <input
                                            type="text"
                                            value={aph2Form.receipt_book}
                                            onChange={(e) => setAph2Form({ ...aph2Form, receipt_book: e.target.value })}
                                            className="w-24 text-center font-bold bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                                            placeholder="(เว้นว่างได้)"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span>เลขที่:</span>
                                        <input
                                            type="text"
                                            value={aph2Form.receipt_no}
                                            onChange={(e) => setAph2Form({ ...aph2Form, receipt_no: e.target.value })}
                                            className="w-20 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                            placeholder="เลขที่"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span>ปี:</span>
                                        <input
                                            type="text"
                                            value={aph2Form.license_year}
                                            onChange={(e) => setAph2Form({ ...aph2Form, license_year: e.target.value })}
                                            className="w-16 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                            placeholder="๒๕๖๙"
                                        />
                                    </div>
                                </div>

                                <div className="text-right text-xs text-slate-500 font-sans">
                                    แบบ อภ. ๒
                                </div>
                            </div>

                            {/* หัวเรื่องใบอนุญาต */}
                            <div className="text-center font-bold text-xl mb-1 tracking-tight">
                                ใบอนุญาต
                            </div>
                            <div className="text-center font-bold text-lg mb-6 tracking-tight">
                                ประกอบกิจการที่เป็นอันตรายต่อสุขภาพ
                            </div>

                            {/* ข้อ (๑) เจ้าพนักงานท้องถิ่น อนุญาตให้ */}
                            <div className="space-y-4 text-justify leading-loose mb-6">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="indent-10 font-medium">(๑) เจ้าพนักงานท้องถิ่น อนุญาตให้:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.owner_name}
                                        onChange={(e) => setAph2Form({ ...aph2Form, owner_name: e.target.value })}
                                        className="font-semibold text-slate-900 border-b border-dotted border-slate-800 outline-none px-2 py-0.5 w-64 focus:bg-emerald-50 transition"
                                        placeholder="ชื่อ-นามสกุล ผู้ได้รับใบอนุญาต"
                                    />
                                    <span>สัญชาติ:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.nationality}
                                        onChange={(e) => setAph2Form({ ...aph2Form, nationality: e.target.value })}
                                        className="w-20 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>อยู่บ้านเลขที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.office_address}
                                        onChange={(e) => setAph2Form({ ...aph2Form, office_address: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>หมู่ที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.moo}
                                        onChange={(e) => setAph2Form({ ...aph2Form, moo: e.target.value })}
                                        className="w-14 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>ตำบล:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.subdistrict}
                                        onChange={(e) => setAph2Form({ ...aph2Form, subdistrict: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>อำเภอ:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.district}
                                        onChange={(e) => setAph2Form({ ...aph2Form, district: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>จังหวัด:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.province}
                                        onChange={(e) => setAph2Form({ ...aph2Form, province: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>ทะเบียนนิติบุคคล/บัตรประชาชนเลขที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.id_card_or_juristic}
                                        onChange={(e) => setAph2Form({ ...aph2Form, id_card_or_juristic: e.target.value })}
                                        className="w-56 font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50"
                                        placeholder="เลขประจำตัว ๑๓ หลัก"
                                    />
                                    <span>โทรศัพท์:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.phone}
                                        onChange={(e) => setAph2Form({ ...aph2Form, phone: e.target.value })}
                                        className="w-40 font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50"
                                        placeholder="๐๘x-xxx-xxxx"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>ชื่อสถานประกอบการ:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_name}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_name: e.target.value })}
                                        className="font-semibold text-slate-900 border-b border-dotted border-slate-800 outline-none px-2 py-0.5 flex-1 min-w-[260px] focus:bg-emerald-50"
                                        placeholder="พิมพ์ชื่อสถานประกอบการ"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>ประเภท:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.operation_type}
                                        onChange={(e) => setAph2Form({ ...aph2Form, operation_type: e.target.value })}
                                        className="font-semibold text-slate-900 border-b border-dotted border-slate-800 outline-none px-2 py-0.5 flex-1 min-w-[260px] focus:bg-emerald-50"
                                        placeholder="ประเภทการประกอบกิจการ"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>ตั้งอยู่เลขที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_address}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_address: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>หมู่ที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_moo}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_moo: e.target.value })}
                                        className="w-14 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>ตำบล:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_subdistrict}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_subdistrict: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>อำเภอ:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_district}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_district: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                    <span>จังหวัด:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_province}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_province: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                    />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>โทรศัพท์สถานประกอบการ:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.shop_phone}
                                        onChange={(e) => setAph2Form({ ...aph2Form, shop_phone: e.target.value })}
                                        className="w-48 font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50"
                                    />
                                </div>
                            </div>

                            {/* ข้อ (๒) การปฏิบัติตามเงื่อนไข */}
                            <div className="mb-4 text-justify leading-relaxed">
                                <span className="indent-10 font-medium">(๒) ผู้ได้รับใบอนุญาตต้องปฏิบัติตาม</span>
                                <span>เงื่อนไขทั่วไปและเงื่อนไขเฉพาะในการประกอบกิจการตามที่ระบุไว้ด้านหลังใบอนุญาตนี้</span>
                            </div>

                            {/* ข้อ (๓) ค่าธรรมเนียมและใบเสร็จ */}
                            <div className="space-y-3 mb-6 leading-loose">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="indent-10 font-medium">(๓) อัตราค่าธรรมเนียมปีละ:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.fee}
                                        onChange={(e) => setAph2Form({ ...aph2Form, fee: e.target.value })}
                                        className="w-24 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="จำนวนเงิน"
                                    />
                                    <span>บาท (</span>
                                    <input
                                        type="text"
                                        value={aph2Form.fee_text}
                                        onChange={(e) => setAph2Form({ ...aph2Form, fee_text: e.target.value })}
                                        className="w-56 font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50"
                                        placeholder="(ตัวหนังสือ เช่น สองร้อยบาทถ้วน)"
                                    />
                                    <span>)</span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>ตามใบเสร็จรับเงิน เล่มที่/เลขที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.receipt_info}
                                        onChange={(e) => setAph2Form({ ...aph2Form, receipt_info: e.target.value })}
                                        className="w-44 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50 text-slate-900"
                                        placeholder="เช่น RCPT-00277/68"
                                    />
                                    <span>ลงวันที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.receipt_date}
                                        onChange={(e) => setAph2Form({ ...aph2Form, receipt_date: e.target.value })}
                                        className="w-48 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-2 py-0.5 focus:bg-emerald-50"
                                        placeholder="วันที่ออกใบเสร็จ"
                                    />
                                </div>
                            </div>

                            {/* ข้อ (๔) เงื่อนไขเฉพาะการประกอบกิจการ (๔.๓ และ ๔.๔) */}
                            <div className="space-y-3 mb-8 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                                <div className="font-medium text-slate-900 flex items-center justify-between">
                                    <span>(๔) เงื่อนไขเฉพาะการประกอบกิจการ (เจ้าหน้าที่สามารถเพิ่มหรือเว้นว่างได้):</span>
                                    <span className="text-xs text-slate-500 font-sans font-normal">
                                        *ถ้าไม่มีเงื่อนไขใช้แม่แบบปกติ | มี ๑ ข้อใช้ 4.3 | มี ๒ ข้อใช้ 4.4
                                    </span>
                                </div>

                                <div className="space-y-3 pl-4 text-sm">
                                    <div>
                                        <span className="text-slate-600 block mb-1">เงื่อนไขข้อ ๔.๓ (เงื่อนไขพิเศษข้อที่ ๑):</span>
                                        <input
                                            type="text"
                                            value={aph2Form.condition_4_3}
                                            onChange={(e) => setAph2Form({ ...aph2Form, condition_4_3: e.target.value })}
                                            className="w-full font-semibold border-b border-slate-400 bg-white rounded-md p-1.5 px-3 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                            placeholder="พิมพ์ข้อความเงื่อนไขข้อ ๔.๓ (หากไม่มีให้เว้นว่าง)"
                                        />
                                    </div>

                                    <div>
                                        <span className="text-slate-600 block mb-1">เงื่อนไขข้อ ๔.๔ (เงื่อนไขพิเศษข้อที่ ๒):</span>
                                        <input
                                            type="text"
                                            value={aph2Form.condition_4_4}
                                            onChange={(e) => setAph2Form({ ...aph2Form, condition_4_4: e.target.value })}
                                            className="w-full font-semibold border-b border-slate-400 bg-white rounded-md p-1.5 px-3 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                            placeholder="พิมพ์ข้อความเงื่อนไขข้อ ๔.๔ (หากไม่มีให้เว้นว่าง)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ข้อ (๕) วันที่ออกใบอนุญาต และ ข้อ (๖) วันที่สิ้นอายุ */}
                            <div className="space-y-3 mb-8 text-sm">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="indent-10 font-medium">(๕) ใบอนุญาตออกให้เมื่อวันที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.issue_day}
                                        onChange={(e) => setAph2Form({ ...aph2Form, issue_day: e.target.value })}
                                        className="w-12 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="วัน"
                                    />
                                    <span>เดือน:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.issue_month}
                                        onChange={(e) => setAph2Form({ ...aph2Form, issue_month: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="เดือน"
                                    />
                                    <span>พ.ศ.:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.issue_year}
                                        onChange={(e) => setAph2Form({ ...aph2Form, issue_year: e.target.value })}
                                        className="w-16 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="พ.ศ."
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="indent-10 font-medium">(๖) ใบอนุญาตสิ้นอายุเมื่อวันที่:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.expire_day}
                                        onChange={(e) => setAph2Form({ ...aph2Form, expire_day: e.target.value })}
                                        className="w-12 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="วัน"
                                    />
                                    <span>เดือน:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.expire_month}
                                        onChange={(e) => setAph2Form({ ...aph2Form, expire_month: e.target.value })}
                                        className="w-28 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="เดือน"
                                    />
                                    <span>พ.ศ.:</span>
                                    <input
                                        type="text"
                                        value={aph2Form.expire_year}
                                        onChange={(e) => setAph2Form({ ...aph2Form, expire_year: e.target.value })}
                                        className="w-16 text-center font-semibold border-b border-dotted border-slate-800 outline-none px-1 py-0.5 focus:bg-emerald-50"
                                        placeholder="พ.ศ."
                                    />
                                </div>
                            </div>

                            {/* ลายเซ็นต์นายก อบต. */}
                            <div className="space-y-6 pt-6 border-t border-slate-200">
                                <div className="float-right text-center w-80 space-y-3">
                                    <div>(ลงชื่อ)............................................................</div>
                                    <div className="text-slate-800 font-semibold">
                                        (นายกองค์การบริหารส่วนตำบลดอยงาม)
                                    </div>
                                    <div className="text-xs text-slate-500">เจ้าพนักงานท้องถิ่น</div>
                                </div>
                                <div className="clear-both" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* โหมดที่ ๒: พรีวิว PDF (อภ.๑) */}
            {activeTab === 'pdf_preview' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
                    <iframe
                        ref={iframeRef}
                        key={appTemplatePdfUrl}
                        src={appTemplatePdfUrl}
                        title="Official APH.1 PDF"
                        className="w-full h-[950px] rounded-xl border border-slate-200 bg-slate-50"
                    />
                </div>
            )}

            {/* โหมดที่ ๓: ใบอนุญาต (อภ.๒) */}
            {activeTab === 'aph2' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
                    <iframe
                        key={aph2PdfUrl}
                        src={aph2PdfUrl}
                        title="APH.2 Certificate PDF"
                        className="w-full h-[950px] rounded-xl border border-slate-200 bg-slate-50"
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
