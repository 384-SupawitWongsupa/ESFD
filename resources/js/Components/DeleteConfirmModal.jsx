import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/Components/ui/Button';

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'ยืนยันการลบข้อมูล',
    itemName = '',
    itemType = 'รายการ',
    warningText = 'การดำเนินการนี้ไม่สามารถเรียกคืนข้อมูลกลับมาได้ ข้อมูลใบอนุญาต ประวัติการตรวจ และเอกสารทั้งหมดที่เกี่ยวข้องจะถูกลบออกจากระบบอย่างถาวร',
    requireConfirmText = false,
    processing = false,
}) {
    const [typedConfirm, setTypedConfirm] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requireConfirmText && typedConfirm !== itemName) {
            return;
        }
        onConfirm();
    };

    const isMatch = !requireConfirmText || typedConfirm === itemName;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            ประเภท: <strong className="text-slate-700">{itemType}</strong>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Target Name Card */}
                {itemName && (
                    <div className="p-3 mb-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-slate-500 block mb-0.5">รายการที่ต้องการลบ:</span>
                        <span className="font-bold text-slate-900 text-sm break-words">{itemName}</span>
                    </div>
                )}

                {/* Warning message */}
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
                    <strong>คำเตือน:</strong> {warningText}
                </div>

                {/* Optional confirmation text input */}
                {requireConfirmText && (
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            พิมพ์ชื่อ <strong className="text-red-700 font-mono">{itemName}</strong> ด้านล่างเพื่อยืนยัน:
                        </label>
                        <input
                            type="text"
                            value={typedConfirm}
                            onChange={(e) => setTypedConfirm(e.target.value)}
                            placeholder="พิมพ์ชื่อให้ตรงกันเพื่อปลดล็อกปุ่มลบ"
                            className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                        className="text-xs px-4"
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={processing || !isMatch}
                        className="text-xs px-5 bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {processing ? 'กำลังลบข้อมูล...' : 'ยืนยันการลบถาวร'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

