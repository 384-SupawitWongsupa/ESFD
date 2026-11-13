import React from 'react';
import { useForm } from '@inertiajs/react';

export default function InspectionRecordModal({ isOpen, onClose, business = null, businesses = [], rounds = [], initialRoundId = null }) {
    if (!isOpen) return null;

    const initialBiz = business || (businesses.length > 0 ? businesses[0] : null);
    const initialBizLatestLicense = initialBiz?.licenses?.[0];

    const { data, setData, post, processing, errors, reset } = useForm({
        business_id: initialBiz?.business_id || '',
        round_id: initialRoundId || rounds[0]?.round_id || 'new',
        new_round_name: '',
        new_round_date: new Date().toISOString().split('T')[0],
        condition_4_3: 'ปฏิบัติตามมาตรฐานสุขอนามัยและระเบียบกระทรวงสาธารณสุขโดยเคร่งครัด',
        condition_4_4: 'ดูแลรักษาความสะอาด ความปลอดภัย และไม่สร้างความเดือดร้อนรำคาญแก่ชุมชน',
        fee: initialBizLatestLicense?.fee || '500.00',
        receipt_book: initialBizLatestLicense?.receipt_book || '',
        receipt_no: initialBizLatestLicense?.receipt_no || '',
        receipt_date: new Date().toISOString().split('T')[0],
        notes: '',
        file_url: '',
        attachment: null,
    });

    const isCreatingNewRound = data.round_id === 'new';
    const activeBusiness = business || businesses.find(b => String(b.business_id) === String(data.business_id)) || initialBiz;

    // กู้คืนแบบร่างการตรวจของสถานประกอบการนี้ (ถ้ามี)
    React.useEffect(() => {
        if (!data.business_id) return;
        try {
            const draft = localStorage.getItem(`dng_inspection_draft_${data.business_id}`);
            if (draft) {
                const parsed = JSON.parse(draft);
                if (parsed && (parsed.notes || parsed.receipt_no || parsed.receipt_book)) {
                    setData(prev => ({
                        ...prev,
                        notes: parsed.notes || prev.notes,
                        receipt_book: parsed.receipt_book || prev.receipt_book,
                        receipt_no: parsed.receipt_no || prev.receipt_no,
                        condition_4_3: parsed.condition_4_3 || prev.condition_4_3,
                        condition_4_4: parsed.condition_4_4 || prev.condition_4_4,
                    }));
                }
            }
        } catch (e) {}
    }, [data.business_id]);

    // บันทึกแบบร่างอัตโนมัติป้องกันไฟดับหรือปิดกะทันหัน
    React.useEffect(() => {
        if (data.business_id && (data.notes || data.receipt_no || data.receipt_book)) {
            try {
                localStorage.setItem(`dng_inspection_draft_${data.business_id}`, JSON.stringify({
                    notes: data.notes,
                    receipt_book: data.receipt_book,
                    receipt_no: data.receipt_no,
                    condition_4_3: data.condition_4_3,
                    condition_4_4: data.condition_4_4,
                }));
            } catch (e) {}
        }
    }, [data.notes, data.receipt_no, data.receipt_book, data.condition_4_3, data.condition_4_4]);

    const handleSelectBusiness = (bId) => {
        const found = businesses.find(b => String(b.business_id) === String(bId));
        const lic = found?.licenses?.[0];
        setData(prev => ({
            ...prev,
            business_id: bId,
            fee: lic?.fee || prev.fee || '500.00',
            receipt_book: lic?.receipt_book || prev.receipt_book || '',
            receipt_no: lic?.receipt_no || prev.receipt_no || '',
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/inspections/record', {
            onSuccess: () => {
                if (data.business_id) {
                    localStorage.removeItem(`dng_inspection_draft_${data.business_id}`);
                }
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            บันทึกผลการออกตรวจและต่ออายุใบอนุญาต
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {activeBusiness ? `${activeBusiness.shop_name || 'ไม่มีชื่อร้าน'} (${activeBusiness.owner?.owner_name || 'ไม่ระบุเจ้าของ'})` : 'เลือกสถานประกอบการด้านล่าง'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 text-sm font-bold"
                    >
                        ปิด
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 pr-1">
                    {/* เลือกสถานประกอบการ (กรณีเปิดจากหน้ารวมรอบตรวจ) */}
                    {!business && businesses.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                เลือกร้านค้า / สถานประกอบการที่ทำการออกตรวจ <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.business_id}
                                onChange={(e) => handleSelectBusiness(e.target.value)}
                                className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                                required
                            >
                                <option value="">-- กรุณาเลือกสถานประกอบการ --</option>
                                {businesses.map((b) => (
                                    <option key={b.business_id} value={b.business_id}>
                                        {b.shop_name || 'ไม่มีชื่อร้าน'} - ผู้ประกอบการ: {b.owner?.owner_name}
                                    </option>
                                ))}
                            </select>
                            {errors.business_id && <p className="text-xs text-red-500 mt-1">{errors.business_id}</p>}
                        </div>
                    )}
                    {/* รอบการตรวจ */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-800">
                                รอบการออกตรวจสุขลักษณะ <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setData('round_id', isCreatingNewRound ? (rounds[0]?.round_id || '') : 'new')}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                            >
                                {isCreatingNewRound ? '← เลือกรอบที่มีอยู่แล้ว' : '+ สร้างรอบตรวจใหม่ทันที'}
                            </button>
                        </div>

                        {!isCreatingNewRound ? (
                            <div>
                                <select
                                    value={data.round_id}
                                    onChange={(e) => setData('round_id', e.target.value)}
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                                    required
                                >
                                    <option value="">-- เลือกรอบการตรวจ --</option>
                                    {rounds.map((r) => (
                                        <option key={r.round_id} value={r.round_id}>
                                            {r.round_name} (วันที่: {r.inspection_date})
                                        </option>
                                    ))}
                                    <option value="new">+ สร้างรอบการตรวจใหม่บนหน้านี้...</option>
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-1">
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                                    สร้างรอบการตรวจใหม่สำหรับบันทึกนี้โดยตรง ระบบจะบันทึกรอบใหม่เข้าสู่ระบบอัตโนมัติ
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            ชื่อรอบการตรวจใหม่ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.new_round_name}
                                            onChange={(e) => setData('new_round_name', e.target.value)}
                                            placeholder="เช่น ออกตรวจประจำปี 2569"
                                            className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                                            required={isCreatingNewRound}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            วันที่ลงพื้นที่ออกตรวจ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.new_round_date}
                                            onChange={(e) => setData('new_round_date', e.target.value)}
                                            className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                                            required={isCreatingNewRound}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {errors.round_id && <p className="text-xs text-red-500 mt-1">{errors.round_id}</p>}
                        {errors.new_round_name && <p className="text-xs text-red-500 mt-1">{errors.new_round_name}</p>}
                    </div>

                    {/* การเงินและใบเสร็จ */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-800 mb-3">
                            ข้อมูลใบเสร็จรับเงินและการต่ออายุล่วงหน้า 1 ปี
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    เล่มที่ใบเสร็จ
                                </label>
                                <input
                                    type="text"
                                    value={data.receipt_book}
                                    onChange={(e) => setData('receipt_book', e.target.value)}
                                    placeholder="เช่น 01/68"
                                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    เลขที่ใบเสร็จ
                                </label>
                                <input
                                    type="text"
                                    value={data.receipt_no}
                                    onChange={(e) => setData('receipt_no', e.target.value)}
                                    placeholder="เช่น 0045"
                                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    ค่าธรรมเนียม (บาท)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.fee}
                                    onChange={(e) => setData('fee', e.target.value)}
                                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                วันที่ลงในใบเสร็จ
                            </label>
                            <input
                                type="date"
                                value={data.receipt_date}
                                onChange={(e) => setData('receipt_date', e.target.value)}
                                className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                            />
                            <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                                ระบบจะคำนวณวันสิ้นอายุใหม่ล่วงหน้า 1 ปีนับจากวันที่ออกใบเสร็จให้อัตโนมัติ
                            </p>
                        </div>
                    </div>

                    {/* เงื่อนไขพิเศษ 4.3 & 4.4 */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                เงื่อนไขเพิ่มเติมข้อ ๔.๓ (ตามแบบ อภ.๒)
                            </label>
                            <textarea
                                rows={2}
                                value={data.condition_4_3}
                                onChange={(e) => setData('condition_4_3', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                เงื่อนไขเพิ่มเติมข้อ ๔.๔ (ตามแบบ อภ.๒)
                            </label>
                            <textarea
                                rows={2}
                                value={data.condition_4_4}
                                onChange={(e) => setData('condition_4_4', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-700"
                            />
                        </div>
                    </div>

                    {/* หมายเหตุและชื่อผู้ตรวจ */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            หมายเหตุและชื่อเจ้าหน้าที่ผู้ออกตรวจ
                        </label>
                        <input
                            type="text"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="เช่น ตรวจแล้ว ผ่านเกณฑ์มาตรฐาน / ผู้ตรวจ: นายธนภัทร"
                            className="w-full text-sm rounded-xl border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-emerald-700"
                        />
                    </div>

                    {/* แนบไฟล์ภาพถ่ายหรือลิงก์ Google Drive */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            หลักฐานการตรวจ (ภาพถ่าย / สแกนเอกสาร / ลิงก์ Google Drive)
                        </label>
                        <input
                            type="text"
                            value={data.file_url}
                            onChange={(e) => setData('file_url', e.target.value)}
                            placeholder="ลิงก์โฟลเดอร์ Google Drive (ถ้ามี)"
                            className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 mb-2"
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                onChange={(e) => setData('attachment', e.target.files[0])}
                                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="py-2.5 px-5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition shadow-xs disabled:opacity-50"
                        >
                            {processing ? 'กำลังบันทึก...' : 'ยืนยันบันทึกผลออกตรวจและต่ออายุ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
