import React, { useState, useMemo, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import {
    Printer, FileDown, ArrowLeft, FileText, Award,
    Check, CheckCircle2, RotateCcw, Eye
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
    const [activeTab, setActiveTab] = useState('interactive_form'); // 'interactive_form' | 'pdf_preview' | 'aph2'
    const [isPrinting, setIsPrinting] = useState(false);
    const iframeRef = useRef(null);

    // ค่าเริ่มต้นดึงมาจากกิจการและเจ้าของกิจการแต่ละคนโดยอัตโนมัติ
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

    // สร้าง URL สำหรับ PDF ที่กรอกทับ app_template.pdf
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

    const aph2PdfUrl = `/documents/aph2/${business.business_id}/pdf?_t=${Date.now()}`;
    const currentPdfUrl = activeTab === 'aph2' ? aph2PdfUrl : appTemplatePdfUrl;

    // สั่งพิมพ์เอกสารทางการ
    const handlePrint = () => {
        setIsPrinting(true);

        // เปิดหน้าพิมพ์จาก PDF ของแท้ที่กรอกลง app_template.pdf
        const printWindow = window.open(currentPdfUrl, '_blank');
        if (printWindow) {
            printWindow.focus();
        }

        // นำทางกลับหน้ารายละเอียดสถานประกอบการ พร้อมแจ้งเตือนสำเร็จ
        setTimeout(() => {
            router.post(`/documents/after-print/${business.business_id}`, {
                doc_type: activeTab === 'aph2' ? 'aph2' : 'app_template',
            });
        }, 1200);
    };

    const handleReturn = () => {
        router.post(`/documents/after-print/${business.business_id}`, {
            doc_type: activeTab === 'aph2' ? 'aph2' : 'app_template',
        });
    };

    return (
        <AuthenticatedLayout
            title="พิมพ์เอกสารราชการ"
            description="กรอกข้อมูลลงในแบบฟอร์มทางการ (app_template.pdf) และสั่งพิมพ์ อบต.ดอยงาม"
        >
            <Head title={`พิมพ์เอกสาร - ${business.shop_name || business.business_id}`} />

            {/* แถบเครื่องมือด้านบน (Action Bar) */}
            <Card className="p-4 mb-5 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/businesses/${business.business_id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs font-normal text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>กลับหน้ารายละเอียดร้าน</span>
                            </Button>
                        </Link>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                {activeTab === 'aph2'
                                    ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๒)'
                                    : 'แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต (แบบฟอร์มทางการ app_template.pdf)'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                กิจการ: <strong className="text-slate-800">{business.shop_name || 'ไม่มีชื่อร้าน'}</strong> — เจ้าของ: <strong className="text-slate-800">{owner?.owner_name}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* แท็บสลับโหมด */}
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
                                <span>พรีวิว PDF (app_template)</span>
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
                            ระบบดึงชื่อกิจการและชื่อเจ้าของกิจการมาใส่ในแบบฟอร์มให้เรียบร้อยแล้ว สามารถพิมพ์กรอกแก้ไขในแต่ละช่องและเลือกติ๊กถูกเองได้ตามต้องการ
                        </span>
                    </div>
                </div>
            </Card>

            {/* โหมดที่ ๑: แบบฟอร์มกรอกข้อมูลลงในแบบฟอร์มโดยตรง (Interactive In-Place Form) */}
            {activeTab === 'interactive_form' && (
                <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-8 sm:p-14 max-w-4xl mx-auto text-slate-900 leading-relaxed font-serif text-[15.5px]">
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

            {/* โหมดที่ ๒: พรีวิว PDF ตัวจริง (app_template.pdf) ที่นำข้อมูลทั้งหมดไปวางบนแบบฟอร์มทางการ */}
            {activeTab === 'pdf_preview' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
                    <iframe
                        ref={iframeRef}
                        key={appTemplatePdfUrl}
                        src={appTemplatePdfUrl}
                        title="Official app_template PDF"
                        className="w-full h-[950px] rounded-xl border border-slate-200 bg-slate-50"
                    />
                </div>
            )}

            {/* โหมดที่ ๓: ใบอนุญาต อภ.๒ */}
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
