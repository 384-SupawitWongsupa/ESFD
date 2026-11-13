import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { Card, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Printer, FileDown, ExternalLink } from 'lucide-react';
import { formatThaiDate, formatCitizenId } from '@/lib/utils';
import InspectionRecordModal from '@/Components/InspectionRecordModal';

export default function InspectionIndex({ rounds, records, selectedRoundId, businesses = [] }) {
    const [createRoundModalOpen, setCreateRoundModalOpen] = useState(false);
    const [recordModalOpen, setRecordModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        round_name: '',
        inspection_date: new Date().toISOString().split('T')[0],
    });

    const handleCreateRound = (e) => {
        e.preventDefault();
        post('/inspections/rounds', {
            onSuccess: () => {
                reset();
                setCreateRoundModalOpen(false);
            },
        });
    };

    const handleFilterRound = (roundId) => {
        router.get('/inspections', roundId ? { round_id: roundId } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            title="ระบบบริหารรอบการออกตรวจและบันทึกผลหน้างาน"
            description="บริหารจัดการวาระการออกตรวจ เงื่อนไขสุขลักษณะ และการส่งต่องานออกใบอนุญาต"
        >
            <Head title="งานตรวจสุขลักษณะ" />

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="page-title">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        รอบการออกตรวจและบันทึกผลสุขลักษณะ
                    </h2>
                    <p className="subtitle text-xs text-slate-500 mt-0.5">
                        บริหารจัดการวาระการออกตรวจ เงื่อนไขพิเศษ ๔.๓ / ๔.๔ และเชื่อมต่อฝ่ายสำนักงาน
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={() => setRecordModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                    >
                        + บันทึกผลตรวจสถานประกอบการ
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setCreateRoundModalOpen(true)}
                        variant="outline"
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs"
                    >
                        กำหนดรอบตรวจใหม่
                    </Button>
                </div>
            </div>

            {/* Rounds Overview Cards */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        เลือกรอบการตรวจ (คลิกเพื่อกรองข้อมูล):
                    </span>
                    {selectedRoundId && (
                        <button
                            onClick={() => handleFilterRound(null)}
                            className="text-xs text-emerald-800 font-semibold hover:underline"
                        >
                            แสดงผลทุกรอบการตรวจ
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div
                        onClick={() => handleFilterRound(null)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                            !selectedRoundId
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <div className={`text-xs font-semibold ${!selectedRoundId ? 'text-emerald-100' : 'text-slate-500'}`}>
                            รอบทั้งหมด
                        </div>
                        <div className="text-lg font-bold mt-1">รวมทุกวาระ</div>
                        <div className={`text-xs mt-1 ${!selectedRoundId ? 'text-emerald-100' : 'text-slate-400'}`}>
                            แสดงผลทุกรายการออกตรวจ
                        </div>
                    </div>

                    {rounds.map((r) => {
                        const isSelected = String(selectedRoundId) === String(r.round_id);
                        return (
                            <div
                                key={r.round_id}
                                onClick={() => handleFilterRound(r.round_id)}
                                className={`p-4 rounded-xl border cursor-pointer transition ${
                                    isSelected
                                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className={`text-xs font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                                    วันที่: {formatThaiDate(r.inspection_date)}
                                </div>
                                <div className="text-sm font-bold mt-1 truncate">{r.round_name}</div>
                                <div className={`text-xs mt-1 font-semibold ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                    ตรวจแล้ว {r.inspection_records_count || 0} แห่ง
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Inspection Records Table */}
            <Card className="overflow-hidden border-slate-200 shadow-xs">
                <CardHeader className="p-5 border-b border-slate-200 bg-slate-50">
                    <CardTitle className="text-base font-bold text-slate-800">
                        บันทึกผลการออกตรวจสถานประกอบการ
                    </CardTitle>
                </CardHeader>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-4 px-5">สถานประกอบการ</th>
                                <th className="py-4 px-5">ผู้ประกอบการ</th>
                                <th className="py-4 px-5">รอบตรวจ</th>
                                <th className="py-4 px-5">เงื่อนไขข้อ ๔.๓ & ๔.๔</th>
                                <th className="py-4 px-5">หมายเหตุ</th>
                                <th className="py-4 px-5">หลักฐาน</th>
                                <th className="py-4 px-5 text-right">พิมพ์ / เอกสาร</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {records.data && records.data.length > 0 ? (
                                records.data.map((rec) => (
                                    <tr key={rec.record_id} className="hover:bg-slate-50 transition">
                                        <td className="py-4 px-5 font-bold text-slate-900">
                                            {rec.business?.shop_name || 'ไม่มีชื่อร้าน'}
                                            <div className="text-xs text-slate-500 font-normal mt-0.5">
                                                {rec.business?.category?.category_name}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="font-normal text-slate-800">
                                                {rec.business?.owner?.owner_name}
                                            </div>
                                            <div className="text-xs text-slate-400 font-normal mt-0.5">
                                                {formatCitizenId(rec.business?.owner?.citizen_id)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-normal">
                                                {rec.round?.round_name}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 max-w-xs space-y-1 text-xs font-normal">
                                            {rec.condition_4_3 && (
                                                <div className="text-slate-600">
                                                    <span className="font-bold text-slate-700">๔.๓:</span> {rec.condition_4_3}
                                                </div>
                                            )}
                                            {rec.condition_4_4 && (
                                                <div className="text-slate-600">
                                                    <span className="font-bold text-slate-700">๔.๔:</span> {rec.condition_4_4}
                                                </div>
                                            )}
                                            {!rec.condition_4_3 && !rec.condition_4_4 && (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-xs text-slate-600 font-normal">
                                            {rec.notes || '-'}
                                        </td>
                                        <td className="py-4 px-5">
                                            {rec.file_url ? (
                                                <a
                                                    href={rec.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-normal underline"
                                                >
                                                    <span>เปิดไฟล์</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/documents/preview/${rec.business_id}`}
                                                    title="พิมพ์ใบอนุญาต อภ.๒"
                                                    className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-2xs inline-flex items-center justify-center"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Link>
                                                <a
                                                    href={`/documents/aph2/${rec.business_id}/word`}
                                                    title="ดาวน์โหลดไฟล์ Word (.docx)"
                                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center justify-center"
                                                >
                                                    <FileDown className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <div className="max-w-md mx-auto text-center space-y-2.5">
                                            <p className="text-sm font-bold text-slate-700">
                                                ยังไม่มีข้อมูลผลการออกตรวจในรอบนี้
                                            </p>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                รอบการตรวจนี้ถูกบันทึกในฐานข้อมูลเรียบร้อยแล้ว ท่านสามารถคลิกปุ่มด้านล่างเพื่อเลือกร้านค้าและบันทึกผลการออกตรวจสุขลักษณะเข้าสู่รอบนี้ได้ทันที
                                            </p>
                                            <div className="pt-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => setRecordModalOpen(true)}
                                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs"
                                                >
                                                    + บันทึกผลการตรวจร้านค้าในรอบนี้
                                                </Button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={records.links} />
            </Card>

            {/* Inspection Record Modal */}
            <InspectionRecordModal
                isOpen={recordModalOpen}
                onClose={() => setRecordModalOpen(false)}
                businesses={businesses}
                rounds={rounds}
                initialRoundId={selectedRoundId}
            />

            {/* Create Round Modal */}
            {createRoundModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-base font-bold text-slate-800">
                                กำหนดรอบการออกตรวจสุขลักษณะใหม่
                            </h3>
                            <button
                                onClick={() => setCreateRoundModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                            >
                                ปิด
                            </button>
                        </div>

                        <form onSubmit={handleCreateRound} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ชื่อรอบการออกตรวจ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.round_name}
                                    onChange={(e) => setData('round_name', e.target.value)}
                                    placeholder="เช่น ออกตรวจประจำปี หรือ ไตรมาส 2/2568"
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                    required
                                />
                                {errors.round_name && <p className="text-xs text-red-500 mt-1">{errors.round_name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    วันที่ออกตรวจตามวาระ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.inspection_date}
                                    onChange={(e) => setData('inspection_date', e.target.value)}
                                    className="w-full text-sm rounded-xl border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setCreateRoundModalOpen(false)}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                                >
                                    {processing ? 'กำลังบันทึก...' : 'สร้างรอบตรวจ'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
