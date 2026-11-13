import React, { useState } from 'react';
import axios from 'axios';
import { formatCitizenId } from '@/lib/utils';

export default function SmartCardModal({ isOpen, onClose, onCardDataReceived, mode = 'fill' }) {
    const [loading, setLoading] = useState(false);
    const [cardData, setCardData] = useState(null);
    const [statusMessage, setStatusMessage] = useState('พร้อมอ่านข้อมูลจากเครื่องอ่านบัตรประจำตัวประชาชน USB');
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleReadRealCard = async (isMock = false) => {
        setLoading(true);
        setError(null);
        setStatusMessage(isMock ? 'กำลังจำลองข้อมูล...' : 'กำลังส่งคำสั่ง APDU อ่านชิปบัตรประจำตัวประชาชน...');

        try {
            const url = isMock ? '/api/smartcard/mock' : '/api/smartcard/read';
            const response = await axios.get(url);
            if (response.data && response.data.success) {
                setCardData(response.data.data);
                setStatusMessage(`อ่านข้อมูลสำเร็จจาก ${response.data.data.reader_name || 'เครื่องอ่านบัตร'}`);
                setLoading(false);
            } else {
                setError(response.data.error || 'ไม่สามารถอ่านข้อมูลจากบัตรได้');
                setLoading(false);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครื่องอ่านบัตร กรุณาตรวจสอบการเสียบสาย USB และการเสียบบัตร';
            setError(errorMsg);
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (cardData && onCardDataReceived) {
            onCardDataReceived(cardData);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {mode === 'search' ? 'อ่านบัตรประชาชนเพื่อค้นหาข้อมูล' : 'อ่านบัตรประชาชนเพื่อกรอกข้อมูลลงทะเบียน'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            ระบบเชื่อมต่อเครื่องอ่านบัตรประจำตัวประชาชน USB (PC/SC Feitian / Smart Card)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                    >
                        ปิด
                    </button>
                </div>

                {/* Card Information Preview */}
                <div className="my-6">
                    <div className="rounded-xl bg-slate-900 p-6 text-white border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <span className="text-xs tracking-wider text-slate-400 font-mono">บัตรประจำตัวประชาชนไทย</span>
                            <span className="text-xs text-emerald-400 font-mono">
                                {cardData ? 'อ่านชิปสำเร็จ' : 'สถานะ: พร้อมอ่าน'}
                            </span>
                        </div>

                        <div className="mt-4">
                            <div className="text-xs text-slate-400 font-mono">เลขประจำตัวประชาชน (13 หลัก):</div>
                            <div className="text-xl font-mono tracking-wider font-bold text-emerald-400 mt-1">
                                {cardData ? formatCitizenId(cardData.citizen_id) : 'X-XXXX-XXXXX-XX-X'}
                            </div>
                        </div>

                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <div className="text-xs text-slate-400">ชื่อ - นามสกุล:</div>
                                <div className="text-base font-semibold mt-0.5 text-slate-100">
                                    {cardData ? cardData.owner_name : 'กรุณาเสียบบัตรและกดอ่านข้อมูล'}
                                </div>
                            </div>
                            {cardData && (
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">ที่อยู่:</div>
                                    <div className="text-xs text-slate-200 font-medium">
                                        เลขที่ {cardData.office_address} หมู่ {cardData.moo} ต.{cardData.subdistrict}
                                    </div>
                                </div>
                            )}
                        </div>

                        {cardData && (
                            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                                <span>อุปกรณ์: {cardData.reader_name}</span>
                                <span>วันเกิด: {cardData.birth_date || '-'}</span>
                            </div>
                        )}
                    </div>

                    {/* Status Alert */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className={error ? 'text-red-700 font-semibold' : 'text-slate-700 font-medium'}>
                            {error || statusMessage}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                    <button
                        type="button"
                        onClick={() => handleReadRealCard(false)}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 transition shadow-xs disabled:opacity-50"
                    >
                        {loading ? 'กำลังเชื่อมต่อและอ่านชิปบัตร...' : 'อ่านข้อมูลจากบัตรประชาชน (Smart Card USB)'}
                    </button>

                    {cardData && (
                        <button
                            type="button"
                            onClick={handleApply}
                            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-emerald-950 bg-emerald-100 hover:bg-emerald-200 transition border border-emerald-300"
                        >
                            {mode === 'search' ? 'นำรหัสบัตรประชาชนไปสืบค้นประวัติ' : 'นำข้อมูลลงในแบบฟอร์มลงทะเบียน'}
                        </button>
                    )}

                    {error && (
                        <button
                            type="button"
                            onClick={() => handleReadRealCard(true)}
                            className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 underline transition"
                        >
                            ทดลองอ่านข้อมูลจำลอง (Mock Data)
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
}
