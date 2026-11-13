import React, { useState } from 'react';

/**
 * โทเค็นสีขั้นตอนการดำเนินงาน (STAGES)
 * ปรับปรุงตามปรัชญา Single-Hue Ordinal Ramp โทนเขียวมรกตมาตรฐานท้องถิ่น อบต.ดอยงาม
 */
export const STAGES = [
    { key: 'pending_request', label: 'ยื่นคำขอใหม่ (รอออกตรวจ)', color: '#a7f3d0', text: '#064e3b' },
    { key: 'pending_inspection', label: 'รอออกตรวจสุขลักษณะ', color: '#34d399', text: '#064e3b' },
    { key: 'pending_print', label: 'ตรวจแล้ว รอพิมพ์ใบ อภ.๒', color: '#059669', text: '#ffffff' },
    { key: 'completed', label: 'ออกใบอนุญาตแล้ว (ปกติ)', color: '#064e3b', text: '#ffffff' },
];

/**
 * โทเค็นสีแกน เส้นกริด และการแจ้งเตือน (VIZ)
 */
export const VIZ = {
    grid: '#e2e8f0',     // เส้นกริดแนวตั้ง 25%, 50%, 75%
    axis: '#cbd5e1',     // เส้นแกนฐานกราฟ
    target: '#475569',   // เส้นประแสดงค่าเป้าหมาย (Target line)
    bar: '#059669',      // สีแท่งกราฟเดี่ยวมาตรฐาน
    critical: '#e11d48', // สีแดงเตือนความเสี่ยง (< 50%)
    ink2: '#475569',     // สีข้อความกำกับรอง
    muted: '#94a3b8',    // สีตัวเลขบอกสเกลแกน 0-100%
};

/**
 * ป้ายกำกับสถานะภาพรวมกลุ่ม/หมวดหมู่ (OVERALL)
 */
export const OVERALL = {
    all_completed: { label: 'ดำเนินการครบ 100%', badge: 'bg-emerald-700 text-white font-normal' },
    almost: { label: 'ใกล้ครบเป้าหมาย', badge: 'bg-emerald-100 text-emerald-800 font-normal' },
    in_progress: { label: 'อยู่ระหว่างดำเนินการ', badge: 'bg-amber-100 text-amber-900 font-normal' },
    needs_attention: { label: 'ต้องติดตามเร่งรัด', badge: 'bg-rose-100 text-rose-800 font-normal' },
};

/**
 * Custom Hook สำหรับระบบ Tooltip ไร้ไลบรารีภายนอก
 */
export function useChartTooltip() {
    const [tip, setTip] = useState(null);

    const bind = (title, items) => ({
        onPointerEnter: (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTip({ title, items, x: rect.left + rect.width / 2, y: rect.top });
        },
        onPointerLeave: () => setTip(null),
        onFocus: (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTip({ title, items, x: rect.left + rect.width / 2, y: rect.top });
        },
        onBlur: () => setTip(null),
    });

    return { tip, bind };
}

/**
 * คอมโพเนนต์แสดงผล Tooltip ลอยเหนือจุดชี้
 */
export function ChartTooltip({ tip }) {
    if (!tip) return null;

    return (
        <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-xl backdrop-blur-xs border border-slate-700/50"
            style={{ left: `${tip.x}px`, top: `${tip.y - 6}px` }}
        >
            <div className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-slate-100 text-xs">
                {tip.title}
            </div>
            <div className="space-y-1">
                {tip.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 text-xs font-normal">
                        <span className="flex items-center gap-1.5 text-slate-300">
                            {item.color && (
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                            )}
                            {item.label}
                        </span>
                        <span className="text-white font-normal">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * คอมโพเนนต์การ์ดพาเนลมาตรฐานสำหรับชาร์ต MIS (ChartCard)
 * ปรับขนาดให้ใหญ่ขึ้น ชัดเจนขึ้น หัวข้อเป็นตัวหนา และเนื้อหาเป็นตัว regular ตามข้อกำหนด
 */
export function ChartCard({ title, aside, note, children, className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 flex flex-col justify-between ${className}`}>
            <div>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
                        {note && <p className="text-sm font-normal text-slate-500 mt-1">{note}</p>}
                    </div>
                    {aside && <div className="shrink-0">{aside}</div>}
                </div>
                {children}
            </div>
        </div>
    );
}

export function pct(val, total) {
    if (!total || total === 0) return 0;
    return (val / total) * 100;
}

