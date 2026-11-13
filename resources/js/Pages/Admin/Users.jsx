import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { UserPlus } from 'lucide-react';

export default function AdminUsers({ users }) {
    const [passwordModalUser, setPasswordModalUser] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Form สำหรับรีเซ็ตรหัสผ่าน
    const {
        data: passwordData,
        setData: setPasswordData,
        post: postPassword,
        processing: passwordProcessing,
        errors: passwordErrors,
        reset: resetPassword,
    } = useForm({
        new_password: '',
    });

    // Form สำหรับเพิ่มเจ้าหน้าที่ใหม่โดย Admin
    const {
        data: createData,
        setData: setCreateData,
        post: postCreate,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
    } = useForm({
        username: '',
        name: '',
        email: '',
        position: 'เจ้าหน้าที่บันทึกข้อมูล',
        role: 'staff',
        password: '',
    });

    const handleApprove = (id) => {
        if (confirm('ยืนยันอนุมัติสิทธิ์ให้เจ้าหน้าที่รายนี้เข้าใช้งานระบบ?')) {
            router.post(`/admin/users/${id}/approve`);
        }
    };

    const handleRevoke = (id) => {
        if (confirm('ยืนยันระงับสิทธิ์การใช้งานของเจ้าหน้าที่รายนี้?')) {
            router.post(`/admin/users/${id}/revoke`);
        }
    };

    const handleDelete = (id) => {
        if (confirm('ยืนยันลบบัญชีผู้ใช้นี้ออกจากระบบอย่างถาวร?')) {
            router.delete(`/admin/users/${id}`);
        }
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        postPassword(`/admin/users/${passwordModalUser.id}/reset-password`, {
            onSuccess: () => {
                resetPassword();
                setPasswordModalUser(null);
            },
        });
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        postCreate('/admin/users', {
            onSuccess: () => {
                resetCreate();
                setCreateModalOpen(false);
            },
        });
    };

    return (
        <AuthenticatedLayout title="แผงควบคุมผู้ดูแลระบบและจัดการสิทธิ์">
            <Head title="จัดการเจ้าหน้าที่" />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="page-title">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        รายชื่อเจ้าหน้าที่และสิทธิ์การใช้งาน (RBAC)
                    </h2>
                    <p className="subtitle text-sm font-normal text-slate-500 mt-1">
                        ระบบจัดการบัญชีเจ้าหน้าที่โดยผู้ดูแลระบบ เพิ่มผู้ใช้ใหม่ อนุมัติสิทธิ์ และตั้งรหัสผ่าน
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-normal text-sm py-2 px-4 flex items-center gap-2 shadow-xs"
                    >
                        <UserPlus className="w-4 h-4" />
                        + เพิ่มเจ้าหน้าที่ใหม่
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <Card className="overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-4 px-5">ชื่อ - นามสกุล</th>
                                <th className="py-4 px-5">ชื่อผู้ใช้ (Username)</th>
                                <th className="py-4 px-5">ตำแหน่งงาน</th>
                                <th className="py-4 px-5">ระดับสิทธิ์ (Role)</th>
                                <th className="py-4 px-5">สถานะการอนุมัติ</th>
                                <th className="py-4 px-5 text-right">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-5 font-bold text-slate-900">
                                        {u.name}
                                        {u.email && <div className="text-xs font-normal text-slate-400 mt-0.5">{u.email}</div>}
                                    </td>
                                    <td className="py-4 px-5 font-normal text-slate-700">
                                        {u.username}
                                    </td>
                                    <td className="py-4 px-5 text-slate-600 font-normal">
                                        {u.position || '-'}
                                    </td>
                                    <td className="py-4 px-5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-normal ${
                                            u.role === 'admin'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                            {u.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ (Staff)'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5">
                                        {u.status === 'approved' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                อนุมัติแล้ว
                                            </span>
                                        )}
                                        {u.status === 'pending' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-normal bg-amber-50 text-amber-900 border border-amber-300">
                                                รออนุมัติ
                                            </span>
                                        )}
                                        {u.status === 'revoked' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-normal bg-rose-50 text-rose-800 border border-rose-300">
                                                ระงับสิทธิ์
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {u.status === 'pending' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(u.id)}
                                                    className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-normal text-xs transition shadow-xs"
                                                >
                                                    อนุมัติสิทธิ์
                                                </button>
                                            )}

                                            {u.status === 'approved' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevoke(u.id)}
                                                    className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-normal text-xs border border-rose-200 transition"
                                                >
                                                    ระงับสิทธิ์
                                                </button>
                                            )}

                                            {u.status === 'revoked' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(u.id)}
                                                    className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-normal text-xs border border-emerald-200 transition"
                                                >
                                                    คืนสิทธิ์
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setPasswordModalUser(u)}
                                                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-normal text-xs transition"
                                            >
                                                รีเซ็ตรหัสผ่าน
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(u.id)}
                                                className="py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-normal text-xs transition"
                                                title="ลบบัญชี"
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal: เพิ่มเจ้าหน้าที่ใหม่ (Admin Add User) */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-base font-bold text-slate-800">
                                เพิ่มบัญชีเจ้าหน้าที่ใหม่ (เฉพาะผู้ดูแลระบบ)
                            </h3>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                            >
                                ปิด
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.username}
                                        onChange={(e) => setCreateData('username', e.target.value)}
                                        placeholder="เช่น thanapat"
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal"
                                        required
                                    />
                                    {createErrors.username && <p className="text-xs text-red-500 mt-1">{createErrors.username}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ชื่อ - นามสกุล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.name}
                                        onChange={(e) => setCreateData('name', e.target.value)}
                                        placeholder="เช่น นายธนภัทร พานพัฒนา"
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal"
                                        required
                                    />
                                    {createErrors.name && <p className="text-xs text-red-500 mt-1">{createErrors.name}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        อีเมลติดต่อ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={createData.email}
                                        onChange={(e) => setCreateData('email', e.target.value)}
                                        placeholder="user@doingam.go.th"
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal"
                                        required
                                    />
                                    {createErrors.email && <p className="text-xs text-red-500 mt-1">{createErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ตำแหน่งงาน <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.position}
                                        onChange={(e) => setCreateData('position', e.target.value)}
                                        placeholder="เช่น นักวิชาการสาธารณสุข"
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal"
                                        required
                                    />
                                    {createErrors.position && <p className="text-xs text-red-500 mt-1">{createErrors.position}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ระดับสิทธิ์ในระบบ (Role) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={createData.role}
                                        onChange={(e) => setCreateData('role', e.target.value)}
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal bg-white"
                                        required
                                    >
                                        <option value="staff">เจ้าหน้าที่ (Staff)</option>
                                        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                                    </select>
                                    {createErrors.role && <p className="text-xs text-red-500 mt-1">{createErrors.role}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        รหัสผ่านเริ่มต้น <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={createData.password}
                                        onChange={(e) => setCreateData('password', e.target.value)}
                                        placeholder="อย่างน้อย 6 ตัวอักษร"
                                        className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal"
                                        required
                                    />
                                    {createErrors.password && <p className="text-xs text-red-500 mt-1">{createErrors.password}</p>}
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="font-normal"
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createProcessing}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-normal"
                                >
                                    {createProcessing ? 'กำลังบันทึก...' : 'บันทึกเจ้าหน้าที่ใหม่'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {passwordModalUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-base font-bold text-slate-800">
                                เปลี่ยนรหัสผ่านสำหรับ {passwordModalUser.name}
                            </h3>
                            <button
                                onClick={() => setPasswordModalUser(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                            >
                                ปิด
                            </button>
                        </div>

                        <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    รหัสผ่านใหม่ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData('new_password', e.target.value)}
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-normal transition"
                                    required
                                />
                                {passwordErrors.new_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.new_password}</p>}
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setPasswordModalUser(null)}
                                    className="font-normal"
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={passwordProcessing}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-normal"
                                >
                                    {passwordProcessing ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
