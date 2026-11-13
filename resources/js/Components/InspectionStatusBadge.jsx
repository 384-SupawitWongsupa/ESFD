import React from 'react';

/**
 * InspectionStatusBadge
 * แสดงสถานะขั้นตอนการออกตรวจและใบอนุญาตของสถานประกอบการ
 * @param {string} status - 'pending' | 'inspected'
 * @param {string} workflowStatus - 'pending_request' | 'pending_inspection' | 'pending_print' | 'completed'
 */
export default function InspectionStatusBadge({ status, workflowStatus }) {
    const current = workflowStatus || status;

    if (current === 'pending_request') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-amber-50 text-amber-800 border border-amber-200">
                รอออกใบคำขอ (สธ.๒)
            </span>
        );
    }

    if (current === 'pending_inspection' || current === 'pending') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-slate-100 text-slate-700 border border-slate-200">
                รอออกตรวจ
            </span>
        );
    }

    if (current === 'pending_print') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200">
                รอพิมพ์ใบอนุญาต (อภ.๒)
            </span>
        );
    }

    // inspected or completed
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-emerald-100 text-emerald-900 border border-emerald-300">
            ออกตรวจแล้ว
        </span>
    );
}
