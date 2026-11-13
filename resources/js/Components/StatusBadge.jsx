import React from 'react';

/**
 * StatusBadge — สถานะใบอนุญาต (license)
 * status values: 'active' | 'expired' | 'renewed' | 'pending' (ยังไม่ได้ออกตรวจ)
 */
export default function StatusBadge({ status, expireDate }) {
    // สถานะรอออกตรวจ: สำหรับกิจการที่ลงทะเบียนใหม่ ยังไม่ผ่านการออกตรวจ
    if (status === 'pending_inspection') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-slate-100 text-slate-700 border border-slate-200">
                ยังไม่ได้ออกตรวจ
            </span>
        );
    }
    let isExpired = false;
    let isExpiringSoon = false;

    if (expireDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(expireDate);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0 || status === 'expired') {
            isExpired = true;
        } else if (diffDays <= 90) {
            isExpiringSoon = true;
        }
    } else if (status === 'expired') {
        isExpired = true;
    }

    if (status === 'renewed') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200">
                ต่ออายุแล้ว
            </span>
        );
    }

    if (isExpired) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200">
                หมดอายุแล้ว
            </span>
        );
    }

    if (isExpiringSoon) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-rose-50/70 text-rose-700 border border-rose-200">
                ใกล้หมดอายุ (ภายใน 90 วัน)
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200">
            ปกติ
        </span>
    );
}
