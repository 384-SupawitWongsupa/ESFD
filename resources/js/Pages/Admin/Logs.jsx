import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/Card';
import Pagination from '@/Components/Pagination';
import {
    History,
    Users,
    Search,
    Shield,
    CheckCircle2,
    XCircle,
    Clock,
    Monitor,
    Smartphone,
    Globe,
    RotateCcw,
    Filter,
    Calendar,
    Activity,
    AlertTriangle,
} from 'lucide-react';

// Helper parse browser and OS from user agent
function parseUserAgent(ua) {
    if (!ua) return { os: 'Unknown OS', browser: 'Unknown Browser', isMobile: false };

    let os = 'Unknown OS';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    let browser = 'Browser';
    if (/edg/i.test(ua)) browser = 'MS Edge';
    else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    const isMobile = /mobile|android|iphone|ipad/i.test(ua);

    return { os, browser, isMobile };
}

// Format Thai Date & Time (พ.ศ.)
function formatThaiDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        const day = d.getDate();
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear() + 543;
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day} ${month} ${year} เวลา ${hours}:${minutes}:${seconds} น.`;
    } catch (e) {
        return dateStr;
    }
}

export default function AdminLogs({ logs, filters = {}, stats = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [role, setRole] = useState(filters.role || 'all');
    const [date, setDate] = useState(filters.date || '');

    const handleFilter = (e) => {
        e?.preventDefault();
        router.get('/admin/logs', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            role: role !== 'all' ? role : undefined,
            date: date || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setRole('all');
        setDate('');
        router.get('/admin/logs');
    };

    return (
        <AuthenticatedLayout title="ประวัติการเข้าสู่ระบบ (Login Logs)">
            <Head title="ประวัติการเข้าสู่ระบบ" />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <History className="w-6 h-6 text-emerald-700" />
                        บันทึกประวัติการเข้าสู่ระบบ (Login Audit Trail)
                    </h2>
                    <p className="text-sm font-normal text-slate-500 mt-1">
                        บันทึกการเข้าสู่ระบบของบัญชีผู้ใช้งาน วันเวลา สถานะการยืนยันตัวตน หมายเลข IP และอุปกรณ์
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-6">
                <Link
                    href="/admin/users"
                    className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2"
                >
                    <Users className="w-4 h-4" />
                    รายชื่อเจ้าหน้าที่และสิทธิ์ (Users)
                </Link>
                <Link
                    href="/admin/logs"
                    className="pb-3 text-sm font-semibold text-emerald-700 border-b-2 border-emerald-600 flex items-center gap-2"
                >
                    <History className="w-4 h-4" />
                    ประวัติการเข้าสู่ระบบ (Login Logs)
                </Link>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 1. ทั้งหมด */}
                <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 leading-tight">
                            {(stats.total || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">บันทึกทั้งหมด</div>
                    </div>
                </Card>

                {/* 2. สำเร็จ */}
                <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-700 leading-tight">
                            {(stats.success || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">เข้าสู่ระบบสำเร็จ</div>
                    </div>
                </Card>

                {/* 3. ล้มเหลว */}
                <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-rose-700 leading-tight">
                            {(stats.failed || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">ล้มเหลว / ถูกปฏิเสธ</div>
                    </div>
                </Card>

                {/* 4. วันนี้ */}
                <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-700 leading-tight">
                            {(stats.today || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">เข้าสู่ระบบวันนี้</div>
                    </div>
                </Card>
            </div>

            {/* Filter Toolbar */}
            <Card className="p-4 bg-white border-slate-200 mb-6 shadow-xs">
                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-สกุล หรือ IP..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    {/* Status Select */}
                    <div className="min-w-[140px]">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        >
                            <option value="all">สถานะ: ทั้งหมด</option>
                            <option value="success">✅ สำเร็จ</option>
                            <option value="failed">❌ ล้มเหลว</option>
                        </select>
                    </div>

                    {/* Role Select */}
                    <div className="min-w-[140px]">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        >
                            <option value="all">สิทธิ์: ทั้งหมด</option>
                            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                            <option value="staff">เจ้าหน้าที่ (Staff)</option>
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div className="min-w-[150px]">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    {/* Buttons */}
                    <button
                        type="submit"
                        className="py-2 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition shadow-xs flex items-center gap-1.5"
                    >
                        <Filter className="w-4 h-4" />
                        <span>กรองข้อมูล</span>
                    </button>

                    {(search || status !== 'all' || role !== 'all' || date) && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition flex items-center gap-1"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>รีเซ็ต</span>
                        </button>
                    )}
                </form>
            </Card>

            {/* Logs Table */}
            <Card className="overflow-hidden border-slate-200 shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-3.5 px-4">วันเวลา (Timestamp)</th>
                                <th className="py-3.5 px-4">ชื่อผู้ใช้ (Username)</th>
                                <th className="py-3.5 px-4">ชื่อ-นามสกุล / ตำแหน่ง</th>
                                <th className="py-3.5 px-4">สิทธิ์</th>
                                <th className="py-3.5 px-4">สถานะการเข้า</th>
                                <th className="py-3.5 px-4">IP Address</th>
                                <th className="py-3.5 px-4">อุปกรณ์ & เบราว์เซอร์</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {logs.data && logs.data.length > 0 ? (
                                logs.data.map((log) => {
                                    const uaInfo = parseUserAgent(log.user_agent);
                                    const isSuccess = log.status === 'success';

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* วันเวลา */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900 text-xs sm:text-sm">
                                                    {formatThaiDateTime(log.login_at || log.created_at)}
                                                </div>
                                            </td>

                                            {/* Username */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-semibold text-slate-800">
                                                    {log.username}
                                                </div>
                                            </td>

                                            {/* Name / Position */}
                                            <td className="py-3.5 px-4">
                                                <div className="text-slate-800">
                                                    {log.name || log.user?.name || '-'}
                                                </div>
                                                {log.user?.position && (
                                                    <div className="text-[11px] text-slate-500">
                                                        {log.user.position}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Role */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {log.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                        <Shield className="w-3 h-3" />
                                                        ผู้ดูแลระบบ
                                                    </span>
                                                ) : log.role === 'staff' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                        เจ้าหน้าที่
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                {isSuccess ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        สำเร็จ
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            ล้มเหลว
                                                        </span>
                                                        {log.failure_reason && (
                                                            <div className="text-[11px] text-rose-600 mt-1 font-medium">
                                                                {log.failure_reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* IP Address */}
                                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                                                {log.ip_address || '-'}
                                            </td>

                                            {/* Device & Browser */}
                                            <td className="py-3.5 px-4 text-xs text-slate-600">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    {uaInfo.isMobile ? (
                                                        <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    ) : (
                                                        <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    )}
                                                    <span>{uaInfo.os}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{uaInfo.browser}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                                        <div className="text-base font-semibold text-slate-600">ไม่พบประวัติการเข้าสู่ระบบ</div>
                                        <div className="text-xs text-slate-400 mt-1">ยังไม่มีข้อมูลการเข้าสู่ระบบที่ตรงตามเงื่อนไขการค้นหา</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {logs.links && (
                    <div className="p-4 bg-white border-t border-slate-100">
                        <Pagination links={logs.links} />
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
