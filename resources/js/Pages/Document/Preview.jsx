import React, { useState, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import {
    Printer, FileDown, ArrowLeft, FileText, Award,
    Pencil, Check, X, AlertCircle,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
function toThaiDigits(str) {
    if (!str && str !== 0) return '';
    const d = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
    return String(str).replace(/[0-9]/g, (c) => d[c]);
}

/** Inline editable field — shows underlined text, clicking it turns into an input */
function EditableField({ value, onChange, className = '', wide = false, multiline = false, align = 'left' }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState(value);

    const commit = () => { onChange(draft); setEditing(false); };
    const cancel = () => { setDraft(value); setEditing(false); };

    if (editing) {
        return (
            <span className={`inline-flex items-center gap-0.5 print:hidden ${className}`}>
                {multiline ? (
                    <textarea
                        autoFocus
                        rows={2}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); } if (e.key === 'Escape') cancel(); }}
                        className={`border border-emerald-500 rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-emerald-400 bg-emerald-50 ${wide ? 'w-64' : 'w-40'}`}
                    />
                ) : (
                    <input
                        autoFocus
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
                        className={`border border-emerald-500 rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-emerald-400 bg-emerald-50 ${wide ? 'w-56' : 'w-32'}`}
                    />
                )}
                <button onClick={commit} title="บันทึก" className="text-emerald-600 hover:text-emerald-800"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={cancel} title="ยกเลิก" className="text-slate-400 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
            </span>
        );
    }

    return (
        <span
            onClick={() => { setDraft(value); setEditing(true); }}
            title="คลิกเพื่อแก้ไข"
            className={`group inline-flex items-center gap-0.5 cursor-pointer border-b border-dotted border-slate-700
                        hover:border-emerald-500 hover:text-emerald-800 transition-colors px-1 print:border-0 print:cursor-default ${className}`}
        >
            <span className={`font-semibold ${align === 'right' ? 'text-right' : ''}`}>{value || '……………'}</span>
            <Pencil className="w-2.5 h-2.5 text-slate-300 group-hover:text-emerald-500 print:hidden shrink-0" />
        </span>
    );
}

/** Checkbox — toggle on click */
function EditableCheck({ checked, onChange }) {
    return (
        <span
            onClick={onChange}
            title="คลิกเพื่อเปลี่ยน"
            className="cursor-pointer font-mono text-base select-none print:cursor-default"
        >
            {checked ? '[ / ]' : '[   ]'}
        </span>
    );
}

/* ─── main component ─────────────────────────────────────── */
export default function DocumentPreview({
    business, owner, license, inspection,
    templateData = {}, thaiIssueDate, thaiExpireDate,
}) {
    const [activeDoc, setActiveDoc] = useState('app_template');

    /* editable state for the app_template form */
    const isJuristicDefault = templateData.is_juristic || Boolean(owner?.juristic_id);
    const [form, setForm] = useState({
        operation:         templateData.business_operation || business.operation_type || business.category?.category_name || '',
        dateDay:           templateData.date_day           || '',
        dateMonth:         templateData.date_month         || '',
        dateYear:          templateData.date_year          || '',
        applicantName:     templateData.applicant_name     || owner?.owner_name || '',
        age:               '',
        nationality:       templateData.nationality        || 'ไทย',
        juristicRep:       '',
        refDoc:            '',
        addressNo:         templateData.address_no         || owner?.office_address || business.shop_address || '',
        addressMoo:        templateData.address_moo        || owner?.moo || business.shop_moo || '',
        addressSoi:        templateData.address_soi        || '',
        addressRoad:       templateData.address_road       || '',
        addressSubdistrict:templateData.address_subdistrict|| owner?.subdistrict || 'ดอยงาม',
        addressDistrict:   templateData.address_district   || owner?.district    || 'พาน',
        addressProvince:   templateData.address_province   || owner?.province    || 'เชียงราย',
        phone:             templateData.phone              || owner?.phone || '',
        // checkboxes
        chkCitizenId:  !isJuristicDefault,
        chkLicense:    false,
        chkEia:        false,
        chkPoa:        false,
        chkJuristic:   isJuristicDefault,
        chkSignAuth:   false,
        chkOther:      false,
        otherDoc1:     '',
        otherDoc2:     '',
    });

    const set = useCallback((key) => (val) => setForm((prev) => ({ ...prev, [key]: val })), []);
    const toggle = useCallback((key) => () => setForm((prev) => ({ ...prev, [key]: !prev[key] })), []);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        let hasNavigated = false;

        const returnToBusiness = () => {
            if (hasNavigated) return;
            hasNavigated = true;
            window.removeEventListener('afterprint', returnToBusiness);
            router.post(`/documents/after-print/${business.business_id}`, {
                doc_type: activeDoc,
            });
        };

        window.addEventListener('afterprint', returnToBusiness, { once: true });
        window.print();

        // Fallback เผื่อเบราว์เซอร์ไม่ fire event afterprint
        setTimeout(returnToBusiness, 1500);
    };

    /* build PDF download URL with overridden query params */
    const pdfParams = new URLSearchParams({
        operation:          form.operation,
        date_day:           form.dateDay,
        date_month:         form.dateMonth,
        date_year:          form.dateYear,
        applicant_name:     form.applicantName,
        nationality:        form.nationality,
        address_no:         form.addressNo,
        address_moo:        form.addressMoo,
        address_soi:        form.addressSoi,
        address_road:       form.addressRoad,
        address_subdistrict:form.addressSubdistrict,
        address_district:   form.addressDistrict,
        address_province:   form.addressProvince,
        phone:              form.phone,
        is_juristic:        form.chkJuristic ? '1' : '0',
    });
    const appTemplatePdfUrl = `/documents/app-template/${business.business_id}/pdf?${pdfParams}`;

    return (
        <AuthenticatedLayout
            title="พิมพ์เอกสารราชการ"
            description="แบบฟอร์มคำขอรับใบอนุญาตและใบอนุญาต อบต.ดอยงาม"
        >
            <Head title={`แบบพิมพ์เอกสาร - ${business.shop_name || business.business_id}`} />

            {/* ── Action Bar ── */}
            <Card className="no-print p-4 mb-6 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/businesses/${business.business_id}`}>
                            <Button variant="outline" size="sm"
                                className="h-9 px-3 text-xs font-normal text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>กลับหน้ารายละเอียดร้าน</span>
                            </Button>
                        </Link>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                {activeDoc === 'app_template' ? 'แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต' : 'ใบอนุญาตประกอบกิจการ (แบบ อภ.๒)'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {business.shop_name || 'ไม่มีชื่อทางการค้า'} — {owner?.owner_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tabs */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                            <button type="button" onClick={() => setActiveDoc('app_template')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition flex items-center gap-1.5 ${
                                    activeDoc === 'app_template'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'}`}>
                                <FileText className="w-3.5 h-3.5" />
                                <span>แบบคำขอ</span>
                            </button>
                            <button type="button" onClick={() => setActiveDoc('aph2')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition flex items-center gap-1.5 ${
                                    activeDoc === 'aph2'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'}`}>
                                <Award className="w-3.5 h-3.5" />
                                <span>ใบอนุญาต (อภ.๒)</span>
                            </button>
                        </div>

                        {/* Print */}
                        <Button
                            type="button"
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-normal flex items-center gap-1.5 h-9 px-4 rounded-xl shadow-xs"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{isPrinting ? 'กำลังสั่งพิมพ์...' : 'สั่งพิมพ์'}</span>
                        </Button>

                        {/* Return button */}
                        <button
                            type="button"
                            onClick={() => router.post(`/documents/after-print/${business.business_id}`, { doc_type: activeDoc })}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-normal text-xs border border-slate-200 transition"
                        >
                            <span>เสร็จสิ้น / กลับหน้ารายละเอียด</span>
                        </button>

                        {/* Download PDF */}
                        {activeDoc === 'app_template' ? (
                            <a href={appTemplatePdfUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-normal text-xs border border-slate-200 transition shadow-2xs">
                                <FileDown className="w-4 h-4" />
                                <span>ดาวน์โหลด PDF</span>
                            </a>
                        ) : (
                            <>
                                <a href={`/documents/aph2/${business.business_id}/pdf`} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-normal text-xs border border-slate-200 transition shadow-2xs">
                                    <FileDown className="w-4 h-4" />
                                    <span>ดาวน์โหลด PDF อภ.๒</span>
                                </a>
                                <a href={`/documents/aph2/${business.business_id}/word`}
                                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-normal text-xs border border-slate-200 transition">
                                    <FileDown className="w-4 h-4" />
                                    <span>Word (.docx)</span>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* edit hint */}
                {activeDoc === 'app_template' && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <Pencil className="w-3.5 h-3.5 shrink-0" />
                        <span>คลิกที่ <strong>ข้อความที่ขีดเส้นใต้</strong> เพื่อแก้ไขข้อมูลก่อนพิมพ์ — กด Enter เพื่อบันทึก หรือ Esc เพื่อยกเลิก</span>
                    </div>
                )}
            </Card>

            {/* ── DOCUMENT 1: แบบคำขอ (Editable) ── */}
            {activeDoc === 'app_template' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto px-16 py-12 text-slate-900 leading-relaxed font-serif text-[15.5px] print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">

                    {/* เลขที่คำขอ */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="border border-slate-800 p-2.5 w-48 text-center text-sm leading-tight">
                            <div>คำขอเลขที่: ……………/…………………</div>
                            <div className="text-xs text-slate-500 mt-1">(เจ้าหน้าที่กรอก)</div>
                        </div>
                    </div>

                    {/* ชื่อแบบฟอร์ม */}
                    <div className="text-center font-bold text-lg mb-3 tracking-tight">
                        แบบคำขอรับใบอนุญาต/ต่อใบอนุญาต
                    </div>

                    {/* ประกอบกิจการ */}
                    <div className="text-center text-base mb-5">
                        <span>ประกอบกิจการ: </span>
                        <EditableField value={form.operation} onChange={set('operation')} wide />
                    </div>

                    {/* เขียนที่ / วันที่ */}
                    <div className="flex justify-end mb-6">
                        <div className="w-96 text-left space-y-2 text-sm">
                            <div className="flex items-center gap-1">
                                <span className="shrink-0">เขียนที่:</span>
                                <EditableField value="อบต.ดอยงาม" onChange={() => {}} />
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="shrink-0">วันที่:</span>
                                <EditableField value={form.dateDay} onChange={set('dateDay')} className="w-16" />
                                <span className="shrink-0">เดือน:</span>
                                <EditableField value={form.dateMonth} onChange={set('dateMonth')} wide />
                                <span className="shrink-0">พ.ศ.:</span>
                                <EditableField value={form.dateYear} onChange={set('dateYear')} className="w-20" />
                            </div>
                        </div>
                    </div>

                    {/* ข้อ ๑ */}
                    <div className="space-y-3 leading-loose mb-6 text-justify">
                        <p className="indent-10">
                            ๑. ข้าพเจ้า:{' '}
                            <EditableField value={form.applicantName} onChange={set('applicantName')} wide />
                            {' '}อายุ:{' '}
                            <EditableField value={form.age} onChange={set('age')} className="w-14" />
                            {' '}ปี  สัญชาติ:{' '}
                            <EditableField value={form.nationality} onChange={set('nationality')} />
                        </p>

                        <p>
                            โดย:{' '}
                            <EditableField value={form.juristicRep} onChange={set('juristicRep')} wide />
                            {' '}ผู้มีอำนาจลงนามแทนนิติบุคคล
                        </p>

                        <p>
                            ปรากฏตาม{' '}
                            <EditableField value={form.refDoc} onChange={set('refDoc')} />
                            {'  '}ที่อยู่เลขที่:{' '}
                            <EditableField value={form.addressNo} onChange={set('addressNo')} />
                            {' '}หมู่ที่:{' '}
                            <EditableField value={form.addressMoo} onChange={set('addressMoo')} className="w-14" />
                            {' '}ตรอก/ซอย:{' '}
                            <EditableField value={form.addressSoi} onChange={set('addressSoi')} />
                            {' '}ถนน:{' '}
                            <EditableField value={form.addressRoad} onChange={set('addressRoad')} />
                        </p>

                        <p>
                            แขวง/ตำบล:{' '}
                            <EditableField value={form.addressSubdistrict} onChange={set('addressSubdistrict')} />
                            {' '}เขต/อำเภอ:{' '}
                            <EditableField value={form.addressDistrict} onChange={set('addressDistrict')} />
                            {' '}จังหวัด:{' '}
                            <EditableField value={form.addressProvince} onChange={set('addressProvince')} />
                        </p>

                        <p>
                            หมายเลขโทรศัพท์:{' '}
                            <EditableField value={form.phone} onChange={set('phone')} wide />
                            {' '}ผู้ขออนุญาต
                        </p>
                    </div>

                    {/* ข้อ ๒ เอกสารหลักฐาน */}
                    <div className="space-y-2.5 mb-8">
                        <p>๒. พร้อมคำขอนี้ ข้าพเจ้าได้แนบเอกสารหลักฐานต่าง ๆ มาด้วยแล้ว ดังนี้</p>
                        <div className="pl-6 space-y-2 text-sm">
                            {[
                                { key: 'chkCitizenId', label: 'สำเนาบัตรประจำตัว (ประชาชน/ข้าราชการ/พนักงานรัฐวิสาหกิจ/อื่น ๆ ระบุ …………………………………)' },
                                { key: 'chkLicense',   label: 'สำเนาใบอนุญาตตามกฎหมายที่เกี่ยวข้อง ได้แก่ ……………………………………………………………………' },
                                { key: 'chkEia',       label: 'หนังสือให้ความเห็นชอบการประเมินผลกระทบต่อสิ่งแวดล้อม' },
                                { key: 'chkPoa',       label: 'ใบมอบอำนาจ (ในกรณีที่มีการมอบอำนาจ)' },
                                { key: 'chkJuristic',  label: 'สำเนาหนังสือรับรองการจดทะเบียนเป็นนิติบุคคล' },
                                { key: 'chkSignAuth',  label: 'หลักฐานที่แสดงการเป็นผู้มีอำนาจลงนามแทนนิติบุคคล' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-start gap-2">
                                    <EditableCheck checked={form[key]} onChange={toggle(key)} />
                                    <span>{label}</span>
                                </div>
                            ))}

                            <div className="flex items-start gap-2">
                                <EditableCheck checked={form.chkOther} onChange={toggle('chkOther')} />
                                <span>เอกสารและหลักฐานอื่น ๆ ตามที่ราชการส่วนท้องถิ่นประกาศกำหนด คือ</span>
                            </div>
                            <div className="pl-8 space-y-1">
                                <div className="flex items-center gap-1">
                                    (๑){' '}
                                    <EditableField value={form.otherDoc1} onChange={set('otherDoc1')} wide />
                                </div>
                                <div className="flex items-center gap-1">
                                    (๒){' '}
                                    <EditableField value={form.otherDoc2} onChange={set('otherDoc2')} wide />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* รับรอง */}
                    <div className="space-y-6">
                        <p>ขอรับรองว่า ข้อความในคำขอนี้เป็นความจริงทุกประการ</p>
                        <div className="float-right text-center w-80 space-y-3">
                            <div>(ลงชื่อ)…………………………………………………… ผู้ขออนุญาต</div>
                            <div className="font-semibold">( {form.applicantName || '…………………………………………………'} )</div>
                        </div>
                        <div className="clear-both" />
                    </div>
                </div>
            )}

            {/* ── DOCUMENT 2: ใบอนุญาต อภ.๒ ── */}
            {activeDoc === 'aph2' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto px-16 py-12 text-slate-900 leading-relaxed font-serif text-[15.5px] print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
                    <div className="text-right text-sm font-bold mb-2">แบบ อภ. ๒</div>

                    <div className="flex justify-center mb-3">
                        <img src="/images/logo-doingam.png" alt="ตราอบต.ดอยงาม" className="w-20 h-20 object-contain" />
                    </div>

                    <div className="text-center font-bold text-2xl mb-1 tracking-tight">ใบอนุญาต</div>
                    <div className="text-center font-bold text-lg mb-8 leading-snug">
                        ประกอบกิจการที่เป็นอันตรายต่อสุขภาพ<br />
                        ตามข้อบัญญัติองค์การบริหารส่วนตำบลดอยงาม
                    </div>

                    <div className="flex justify-between items-center text-sm mb-6">
                        <div>เล่มที่ <strong className="text-base">{license?.receipt_book || '-'}</strong></div>
                        <div>เลขที่ <strong className="text-base">{license?.receipt_no || '-'}</strong></div>
                    </div>

                    <div className="text-justify text-base space-y-4 leading-loose">
                        <p className="indent-12">
                            เจ้าพนักงานท้องถิ่นผู้ออกใบอนุญาต ได้อนุญาตให้{' '}
                            <strong className="border-b border-dotted border-slate-800 px-2">{owner?.owner_name}</strong>
                            {' '}เลขประจำตัวประชาชน{' '}
                            <strong className="border-b border-dotted border-slate-800 px-2">{owner?.citizen_id || owner?.juristic_id || '-'}</strong>
                            {' '}อยู่บ้านเลขที่{' '}
                            <span className="border-b border-dotted border-slate-800 px-2">{owner?.office_address || '-'}</span>
                            {' '}หมู่ที่{' '}
                            <span className="border-b border-dotted border-slate-800 px-2">{owner?.moo || '-'}</span>
                            {' '}ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย หมายเลขโทรศัพท์ {owner?.phone || '-'}
                        </p>

                        <p className="indent-12">
                            ประกอบกิจการ{' '}
                            <strong className="border-b border-dotted border-slate-800 px-2">{business.category?.category_name}</strong>
                            {' '}ประเภทการทำกิจการ{' '}
                            <strong className="border-b border-dotted border-slate-800 px-2">{business.operation_type}</strong>
                            {' '}ชื่อสถานประกอบการ{' '}
                            <strong className="border-b border-dotted border-slate-800 px-2">{business.shop_name || 'ไม่มีชื่อทางการค้า'}</strong>
                            {' '}ตั้งอยู่เลขที่{' '}
                            <span className="border-b border-dotted border-slate-800 px-2">{business.shop_address || '-'}</span>
                            {' '}หมู่ที่{' '}
                            <span className="border-b border-dotted border-slate-800 px-2">{business.shop_moo || '-'}</span>
                            {' '}ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย
                            {' '}ขนาดพื้นที่ประกอบการ {business.business_area || '-'}
                            {' '}กำลังเครื่องจักร {business.machine_power || '-'}
                            {' '}คนงาน {business.worker_count || '-'}
                        </p>
                    </div>

                    <div className="my-8 p-5 rounded-xl border border-dashed border-slate-400 bg-slate-50/50 text-sm space-y-2">
                        <div className="font-bold underline text-slate-800">เงื่อนไขเฉพาะการอนุญาตประกอบกิจการ:</div>
                        <div><strong>ข้อ ๔.๓:</strong> {inspection?.condition_4_3 || 'ปฏิบัติตามมาตรฐานสุขอนามัยและระเบียบกระทรวงสาธารณสุขโดยเคร่งครัด'}</div>
                        <div><strong>ข้อ ๔.๔:</strong> {inspection?.condition_4_4 || 'ดูแลรักษาความสะอาด ความปลอดภัย และไม่สร้างความเดือดร้อนรำคาญแก่ชุมชนใกล้เคียง'}</div>
                    </div>

                    <div className="text-sm space-y-2 mb-12">
                        <div>ใบอนุญาตนี้สิ้นอายุในวันที่ <strong className="border-b border-dotted border-slate-800 px-2 text-base">{thaiExpireDate}</strong></div>
                        <div>ค่าธรรมเนียมใบอนุญาต <strong className="text-base">{Number(license?.fee || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> บาท</div>
                        <div className="text-slate-500 text-xs">ออกให้ ณ วันที่ {thaiIssueDate}</div>
                    </div>

                    <div className="float-right text-center w-72 space-y-2">
                        <div className="text-sm">(ลงชื่อ)…………………………………………………………</div>
                        <div className="text-sm font-semibold">(นายกองค์การบริหารส่วนตำบลดอยงาม)</div>
                        <div className="text-xs text-slate-500">เจ้าพนักงานท้องถิ่น</div>
                    </div>
                    <div className="clear-both" />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
