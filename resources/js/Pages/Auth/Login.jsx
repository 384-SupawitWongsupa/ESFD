import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LifeBuoy, Loader2 } from 'lucide-react';
import { Button } from '@/Components/ui/Button';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-[#f5f6f8] flex flex-col justify-between font-sans selection:bg-emerald-700 selection:text-white">
            <Head title="เข้าสู่ระบบ - ระบบออกใบอนุญาตอิเล็กทรอนิกส์" />

            {/* HEADER: แถบ Navbar สีเดียวกับพื้นหลัง (#f5f6f8) พร้อมขยับชื่อและโลโก้ลงมาด้านล่าง */}
            <header className="w-full bg-[#f5f6f8] px-6 sm:px-12 pt-7 pb-3.5 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3.5 mt-1 sm:mt-1.5">
                    <img
                        src="/images/logo-doingam.png"
                        alt="ตราสัญลักษณ์ องค์การบริหารส่วนตำบลดอยงาม"
                        className="w-11 h-11 object-contain shrink-0 drop-shadow-xs"
                    />
                    <div className="min-w-0">
                        <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                            ระบบออกใบอนุญาตอิเล็กทรอนิกส์สำหรับองค์การบริหารส่วนตำบลดอยงาม จังหวัดเชียงราย
                        </h1>
                        <p className="text-[10px] sm:text-xs font-normal text-slate-500 uppercase tracking-wide truncate mt-0.5">
                            E-LICENSING SYSTEM FOR DOI NGAM SUBDISTRICT ADMINISTRATIVE ORGANIZATION, CHIANG RAI
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 mt-1 sm:mt-1.5">
                    <span className="text-xs font-normal text-slate-500">
                        อบต.ดอยงาม อ.พาน จ.เชียงราย
                    </span>
                </div>
            </header>

            {/* MAIN CONTENT: การ์ดทรงมนลอยเด่นสไตล์ Microsoft Underline */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14">
                {/* 1. PRIMARY LOGIN CARD (w: 440px) */}
                <div className="w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.12),0_8px_24px_-12px_rgba(0,0,0,0.18)] px-7 py-9 sm:px-11 sm:py-11">
                    {/* ตราโรงเรียน/อบต. + ชื่อระบบบนหัวการ์ด */}
                    <div className="flex items-center gap-3 mb-6">
                        <img
                            src="/images/logo-doingam.png"
                            alt="ตรา อบต.ดอยงาม"
                            className="w-11 h-11 object-contain shrink-0"
                        />
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 leading-tight">
                                ระบบออกใบอนุญาตอิเล็กทรอนิกส์
                            </div>
                            <div className="text-[0.7rem] font-normal text-slate-500 uppercase tracking-wide truncate mt-0.5">
                                E-LICENSING SYSTEM FOR DOI NGAM
                            </div>
                        </div>
                    </div>

                    {/* หัวข้อเข้าสู่ระบบ */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            เข้าสู่ระบบ
                        </h2>
                        <p className="text-sm font-normal text-slate-500 mt-1">
                            ลงชื่อเข้าใช้ด้วยบัญชีผู้ปฏิบัติงานเพื่อเข้าสู่ระบบงาน
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ฟิลด์ที่ 1: ชื่อผู้ใช้งาน หรือ อีเมล (สไตล์เส้นใต้ Microsoft Underline) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                ชื่อผู้ใช้งาน หรือ อีเมล
                            </label>
                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                placeholder="เช่น admin หรือ user@doingam.go.th"
                                className="h-10 w-full border-0 border-b border-[#8a8886] hover:border-slate-800 focus:border-emerald-700 focus:outline-none focus:ring-0 text-[0.95rem] font-normal bg-transparent px-0 transition-colors"
                                required
                                autoFocus
                            />
                            {errors.username ? (
                                <p className="text-xs text-red-600 font-normal mt-1.5">{errors.username}</p>
                            ) : (
                                <p className="text-[11px] text-slate-400 font-normal mt-1">
                                    ใช้อีเมลทางการหรือชื่อบัญชีที่ได้รับมอบหมาย
                                </p>
                            )}
                        </div>

                        {/* ฟิลด์ที่ 2: รหัสผ่าน (สไตล์เส้นใต้ พร้อมปุ่มเปิด/ปิดตา) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                รหัสผ่าน (Password)
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="กรอกรหัสผ่านของท่าน"
                                    className="h-10 w-full border-0 border-b border-[#8a8886] hover:border-slate-800 focus:border-emerald-700 focus:outline-none focus:ring-0 text-[0.95rem] font-normal bg-transparent pr-10 pl-0 transition-colors"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition"
                                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-600 font-normal mt-1.5">{errors.password}</p>
                            )}
                        </div>

                        {/* ตัวเลือกจดจำฉัน */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded-[4px] border-slate-300 text-emerald-700 focus:ring-emerald-700"
                                />
                                <span className="text-sm font-normal text-slate-600">จดจำการเข้าสู่ระบบ</span>
                            </label>
                        </div>

                        {/* ปุ่มเข้าสู่ระบบ */}
                        <div className="pt-2 flex items-center justify-end">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-10 px-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-normal text-sm shadow-xs flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 w-full sm:w-auto"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        กำลังตรวจสอบสิทธิ์...
                                    </span>
                                ) : (
                                    'เข้าสู่ระบบ'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* 2. HELP DESK CARD (w: 440px) */}
                <div className="w-full max-w-[440px] mt-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.08)] px-7 py-5 sm:px-11">
                    <div className="flex items-start gap-3">
                        <LifeBuoy className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-xs font-bold text-slate-800">
                                ต้องการความช่วยเหลือในการเข้าสู่ระบบ?
                            </h3>
                            <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
                                กรณีลืมรหัสผ่านหรือไม่มีบัญชีผู้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ กองสาธารณสุขและสิ่งแวดล้อม องค์การบริหารส่วนตำบลดอยงาม โทร. 053-956-070
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full py-5 text-center text-xs font-normal text-slate-400 bg-[#f5f6f8]">
                สงวนลิขสิทธิ์ 2569 องค์การบริหารส่วนตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย 57120
            </footer>
        </div>
    );
}
