import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SmartCardModal from '@/Components/SmartCardModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const DRAFT_KEY = 'dng_business_create_draft';

export default function BusinessCreate({ categories, nextBusinessId }) {
    const [smartCardModalOpen, setSmartCardModalOpen] = useState(false);
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        // ผู้ประกอบการ
        citizen_id: '',
        juristic_id: '',
        owner_name: '',
        phone: '',
        office_address: '',
        moo: '',
        subdistrict: 'ดอยงาม',
        district: 'พาน',
        province: 'เชียงราย',

        // กิจการ
        category_id: categories[0]?.category_id || '',
        shop_name: '',
        operation_type: '',
        shop_address: '',
        shop_moo: '',
        shop_phone: '',
        business_area: '',
        machine_power: '',
        worker_count: '',
    });

    // 1. กู้คืนแบบร่างจาก LocalStorage เมื่อโหลดหน้า (ป้องกันไฟดับหรือปิดเบราว์เซอร์กะทันหัน)
    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed && (parsed.owner_name || parsed.shop_name || parsed.citizen_id)) {
                    setData((prev) => ({
                        ...prev,
                        ...parsed,
                    }));
                    setHasRestoredDraft(true);
                    setLastSavedTime(new Date().toLocaleTimeString('th-TH'));
                }
            }
        } catch (e) {
            console.error('Error loading draft', e);
        }
    }, []);

    // 2. บันทึกแบบร่างอัตโนมัติเมื่อมีการพิมพ์กรอกข้อมูล
    useEffect(() => {
        if (data.owner_name || data.shop_name || data.citizen_id || data.phone) {
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
                setLastSavedTime(new Date().toLocaleTimeString('th-TH'));
            } catch (e) {
                console.error('Error saving draft', e);
            }
        }
    }, [data]);

    // 3. แจ้งเตือนก่อนปิดหน้าต่าง หากมีข้อมูลที่กรอกค้างไว้
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (data.owner_name || data.shop_name || data.citizen_id) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [data]);

    const handleClearDraft = () => {
        if (confirm('ต้องการล้างแบบร่างที่บันทึกไว้อัตโนมัติทั้งหมด เพื่อเริ่มกรอกข้อมูลใหม่ใช่หรือไม่?')) {
            localStorage.removeItem(DRAFT_KEY);
            setHasRestoredDraft(false);
            setLastSavedTime(null);
            reset();
        }
    };

    const handleCardDataReceived = (card) => {
        setData((prev) => ({
            ...prev,
            citizen_id: card.citizen_id || prev.citizen_id,
            owner_name: card.owner_name || prev.owner_name,
            office_address: card.office_address || prev.office_address,
            moo: card.moo || prev.moo,
            subdistrict: card.subdistrict || 'ดอยงาม',
            district: card.district || 'พาน',
            province: card.province || 'เชียงราย',
            phone: card.phone || prev.phone,
            shop_address: prev.shop_address || card.office_address || '',
            shop_moo: prev.shop_moo || card.moo || '',
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/businesses', {
            onSuccess: () => {
                // บันทึกสำเร็จ ล้างแบบร่างอัตโนมัติออก
                localStorage.removeItem(DRAFT_KEY);
            },
        });
    };

    return (
        <AuthenticatedLayout title="ลงทะเบียนกิจการและผู้ประกอบการรายใหม่">
            <Head title="ลงทะเบียนกิจการใหม่" />

            {/* แถบแจ้งเตือนการกู้คืนแบบร่างอัตโนมัติ */}
            {hasRestoredDraft && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs shadow-xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                            ระบบได้กู้คืนข้อมูลแบบร่างที่ท่านกรอกค้างไว้ให้อัตโนมัติ (ป้องกันข้อมูลสูญหายจากเหตุการณ์ไฟดับหรือปิดหน้าเว็บกะทันหัน)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClearDraft}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-normal transition shrink-0"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        ล้างแบบร่างเพื่อเริ่มใหม่
                    </button>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="page-title">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        ลงทะเบียนสถานประกอบการใหม่
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                        <p className="subtitle text-xs text-slate-500">
                            รหัสสถานประกอบการถัดไปในระบบ: <span className="font-normal text-emerald-800">#{nextBusinessId}</span> (กำหนดอัตโนมัติ)
                        </p>
                        {lastSavedTime && (
                            <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                บันทึกแบบร่างอัตโนมัติล่าสุด: {lastSavedTime}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={() => setSmartCardModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-emerald-400 font-normal text-xs border border-slate-700"
                    >
                        อ่านบัตรประชาชนอัตโนมัติ (Smart Card)
                    </Button>
                    <Link href="/search">
                        <Button variant="outline" type="button" className="text-xs font-normal">
                            ยกเลิก
                        </Button>
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ส่วนที่ 1: ข้อมูลผู้ประกอบการ / เจ้าของ */}
                <Card className="border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            ส่วนที่ ๑: ข้อมูลผู้ประกอบการ / เจ้าของกิจการ
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            ข้อมูลบุคคลธรรมดา หรือ นิติบุคคลตามกฎหมาย
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    เลขประจำตัวประชาชน ๑๓ หลัก
                                </label>
                                <input
                                    type="text"
                                    maxLength={13}
                                    value={data.citizen_id}
                                    onChange={(e) => setData('citizen_id', e.target.value)}
                                    placeholder="1579900xxxxxx"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                                {errors.citizen_id && <p className="text-xs text-red-500 mt-1">{errors.citizen_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ทะเบียนนิติบุคคลเลขที่ (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    value={data.juristic_id}
                                    onChange={(e) => setData('juristic_id', e.target.value)}
                                    placeholder="เช่น 057556000xxxx"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ชื่อ - นามสกุล หรือ ชื่อนิติบุคคล <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.owner_name}
                                    onChange={(e) => setData('owner_name', e.target.value)}
                                    placeholder="คำนำหน้า ชื่อ นามสกุล"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                    required
                                />
                                {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    หมายเลขโทรศัพท์ติดต่อ
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="08x-xxx-xxxx"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ที่อยู่ตามทะเบียนบ้าน (เลขที่)
                                </label>
                                <input
                                    type="text"
                                    value={data.office_address}
                                    onChange={(e) => setData('office_address', e.target.value)}
                                    placeholder="เช่น 124"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    หมู่ที่ (ตามทะเบียนบ้าน)
                                </label>
                                <input
                                    type="text"
                                    value={data.moo}
                                    onChange={(e) => setData('moo', e.target.value)}
                                    placeholder="เช่น 3"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">ตำบล</label>
                                <input
                                    type="text"
                                    value={data.subdistrict}
                                    onChange={(e) => setData('subdistrict', e.target.value)}
                                    className="w-full text-sm rounded-xl border border-slate-200 py-2.5 px-3 bg-slate-50 text-slate-700 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">อำเภอ</label>
                                <input
                                    type="text"
                                    value={data.district}
                                    onChange={(e) => setData('district', e.target.value)}
                                    className="w-full text-sm rounded-xl border border-slate-200 py-2.5 px-3 bg-slate-50 text-slate-700 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">จังหวัด</label>
                                <input
                                    type="text"
                                    value={data.province}
                                    onChange={(e) => setData('province', e.target.value)}
                                    className="w-full text-sm rounded-xl border border-slate-200 py-2.5 px-3 bg-slate-50 text-slate-700 font-medium"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ส่วนที่ 2: ข้อมูลสถานประกอบการ */}
                <Card className="border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            ส่วนที่ ๒: ข้อมูลสถานที่ประกอบการ / ร้านค้า
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            รายละเอียดลักษณะการดำเนินกิจการและที่ตั้งสถานประกอบการ
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ประเภทกิจการหลัก <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                    required
                                >
                                    {categories.map((c) => (
                                        <option key={c.category_id} value={c.category_id}>
                                            {c.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ชื่อสถานประกอบการ / ร้านค้า
                                </label>
                                <input
                                    type="text"
                                    value={data.shop_name}
                                    onChange={(e) => setData('shop_name', e.target.value)}
                                    placeholder="เช่น ร้านกาแฟสดริมดอย (ว่างได้ถ้าไม่มี)"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    รายละเอียดการดำเนินกิจการ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.operation_type}
                                    onChange={(e) => setData('operation_type', e.target.value)}
                                    placeholder="เช่น จำหน่ายอาหารและเครื่องดื่ม, อู่ซ่อมรถ"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                    required
                                />
                                {errors.operation_type && <p className="text-xs text-red-500 mt-1">{errors.operation_type}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ที่ตั้งสถานประกอบการ (เลขที่)
                                </label>
                                <input
                                    type="text"
                                    value={data.shop_address}
                                    onChange={(e) => setData('shop_address', e.target.value)}
                                    placeholder="เช่น 124/1"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    หมู่ที่ของสถานประกอบการ
                                </label>
                                <input
                                    type="text"
                                    value={data.shop_moo}
                                    onChange={(e) => setData('shop_moo', e.target.value)}
                                    placeholder="เช่น 3"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    หมายเลขโทรศัพท์ร้านค้า
                                </label>
                                <input
                                    type="text"
                                    value={data.shop_phone}
                                    onChange={(e) => setData('shop_phone', e.target.value)}
                                    placeholder="เบอร์โทรศัพท์ร้าน"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ขนาดพื้นที่ประกอบการ
                                </label>
                                <input
                                    type="text"
                                    value={data.business_area}
                                    onChange={(e) => setData('business_area', e.target.value)}
                                    placeholder="เช่น 85 ตารางเมตร"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    กำลังเครื่องจักร (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    value={data.machine_power}
                                    onChange={(e) => setData('machine_power', e.target.value)}
                                    placeholder="เช่น 5 แรงม้า (หรือ -)"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    จำนวนคนงานในร้าน
                                </label>
                                <input
                                    type="text"
                                    value={data.worker_count}
                                    onChange={(e) => setData('worker_count', e.target.value)}
                                    placeholder="เช่น 3 คน"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <Link href="/search">
                        <Button variant="outline" type="button" className="px-5 text-xs font-normal">
                            ย้อนกลับ
                        </Button>
                    </Link>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-slate-500 hidden sm:inline">
                            เมื่อบันทึกแล้ว สถานะเริ่มต้นจะเป็น <strong>"รอออกใบคำขอ"</strong> โดยกดออกใบคำขอก่อน จึงจะปรับเป็น <strong>"รอออกตรวจ"</strong>
                        </span>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="py-3 px-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                        >
                            {processing ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลสถานประกอบการใหม่'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Smart Card Reader Modal */}
            <SmartCardModal
                isOpen={smartCardModalOpen}
                onClose={() => setSmartCardModalOpen(false)}
                onCardDataReceived={handleCardDataReceived}
                mode="fill"
            />
        </AuthenticatedLayout>
    );
}
