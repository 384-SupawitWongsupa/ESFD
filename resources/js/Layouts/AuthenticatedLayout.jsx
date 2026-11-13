import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Search,
    PlusCircle,
    ClipboardCheck,
    CalendarClock,
    Users,
    LogOut,
    Menu,
    X,
    CheckCircle2,
    AlertCircle,
    Shield,
    CreditCard,
    Printer,
} from 'lucide-react';
import SmartCardModal from '@/Components/SmartCardModal';

export default function AuthenticatedLayout({ children, title, description }) {
    const { auth, flash } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [smartCardModalOpen, setSmartCardModalOpen] = useState(false);
    const currentUrl = window.location.pathname;

    const navItems = [
        {
            name: 'แดชบอร์ดภาพรวม',
            href: '/',
            icon: LayoutDashboard,
            active: currentUrl === '/' || currentUrl === '/dashboard',
        },
        {
            name: 'สืบค้นทะเบียนกิจการ',
            href: '/search',
            icon: Search,
            active: currentUrl.startsWith('/search'),
        },
        {
            name: 'ลงทะเบียนกิจการใหม่',
            href: '/businesses/create',
            icon: PlusCircle,
            active: currentUrl.startsWith('/businesses/create'),
        },
        {
            name: 'งานตรวจสุขลักษณะ',
            href: '/inspections',
            icon: ClipboardCheck,
            active: currentUrl.startsWith('/inspections'),
        },
        {
            name: 'ติดตามวันหมดอายุ',
            href: '/expirations',
            icon: CalendarClock,
            active: currentUrl.startsWith('/expirations'),
        },
        {
            name: 'รอพิมพ์ใบ อภ.๒',
            href: '/pending-print',
            icon: Printer,
            active: currentUrl.startsWith('/pending-print'),
        },
    ];

    if (auth.user?.role === 'admin') {
        navItems.push({
            name: 'จัดการเจ้าหน้าที่ (Admin)',
            href: '/admin/users',
            icon: Users,
            active: currentUrl.startsWith('/admin'),
        });
    }

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const handleCardDataForSearch = (cardData) => {
        if (cardData?.citizen_id) {
            router.get('/search', { citizen_id: cardData.citizen_id });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row text-[#1b1c22] font-sans antialiased">
            {/* Mobile Header Bar */}
            <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/images/logo-doingam.png"
                        alt="อบต.ดอยงาม"
                        className="w-9 h-9 object-contain"
                    />
                    <div>
                        <div className="font-bold text-sm text-slate-900 leading-tight">ระบบออกใบอนุญาตอิเล็กทรอนิกส์</div>
                        <div className="text-[10px] text-slate-500">อบต.ดอยงาม อ.พาน จ.เชียงราย</div>
                    </div>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                    aria-label="Toggle navigation"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar — White Theme */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between z-50 transition-transform duration-200 shadow-lg lg:shadow-sm ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                {/* Brand & Nav */}
                <div className="flex flex-col min-h-0">
                    {/* Brand Banner */}
                    <div className="px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo-doingam.png"
                                alt="ตรา อบต.ดอยงาม"
                                className="w-11 h-11 object-contain shrink-0"
                            />
                            <div className="min-w-0">
                                <h1 className="font-bold text-sm text-slate-900 tracking-tight truncate leading-tight">
                                    ระบบออกใบอนุญาต
                                </h1>
                                <p className="text-[11px] text-emerald-700 font-medium truncate">
                                    อบต.ดอยงาม อ.พาน จ.เชียงราย
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-800 font-medium">ระบบออกใบอนุญาตอิเล็กทรอนิกส์</span>
                        </div>
                    </div>

                    {/* Quick Smart Card Instant Trigger */}
                    <div className="px-4 pt-3 pb-1">
                        <button
                            type="button"
                            onClick={() => setSmartCardModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-sm active:scale-[0.98]"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>อ่านบัตรประชาชนเพื่อสืบค้น</span>
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
                            เมนูหลักของระบบ
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                                        item.active
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile Bar */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
                            {auth.user?.name ? auth.user.name.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-900 truncate">{auth.user?.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">{auth.user?.position || 'เจ้าหน้าที่'}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                                    <Shield className="w-2.5 h-2.5" />
                                    {auth.user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition border border-red-200/80 active:scale-[0.98]"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer Backdrop */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden"
                />
            )}

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Topbar Header */}
                <header className="bg-white border-b border-slate-200/90 px-6 py-4 hidden lg:flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div>
                        <h2 className="page-title text-base font-bold text-slate-900 tracking-tight">
                            {title || 'ระบบออกใบอนุญาตอิเล็กทรอนิกส์สำหรับองค์การบริหารส่วนตำบลดอยงาม จังหวัดเชียงราย'}
                        </h2>
                        {description ? (
                            <p className="text-xs text-slate-500 mt-0.5 pl-3.5">{description}</p>
                        ) : (
                            <p className="text-xs text-slate-500 mt-0.5 pl-3.5">
                                องค์การบริหารส่วนตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSmartCardModalOpen(true)}
                            title="อ่านบัตรประจำตัวประชาชน Smart Card"
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 border border-slate-200 transition shrink-0 active:scale-95"
                        >
                            <CreditCard className="w-5 h-5 text-emerald-700" />
                        </button>

                        <div className="h-6 w-px bg-slate-200"></div>

                        <div className="text-right">
                            <div className="text-sm font-normal text-slate-700">
                                {new Date().toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'long',
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="m-4 mb-0 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                            <span className="text-xs font-semibold">{flash.success}</span>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="m-4 mb-0 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-900 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
                            <span className="text-xs font-semibold">{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
            </div>

            {/* Global Smart Card Modal */}
            <SmartCardModal
                isOpen={smartCardModalOpen}
                onClose={() => setSmartCardModalOpen(false)}
                onCardDataReceived={handleCardDataForSearch}
                mode="search"
            />
        </div>
    );
}
