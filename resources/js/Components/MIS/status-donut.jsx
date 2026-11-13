import React, { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { STAGES } from './chart-kit';

const C = 120; // จุดกึ่งกลางใน ViewBox 240x240
const R = 84;  // รัศมีรอบนอก
const IN = 50; // รัศมีรูตรงกลาง
const POP = 8; // ระยะ Pop-out ขยายเมื่อเลือก
const GAP = 0.015; // ร่องตัดแยกชิ้นละ 0.015 เรเดียน

function sector(a0, a1, r0, r1, popDx = 0, popDy = 0) {
    const pt = (a, r) => `${C + popDx + r * Math.sin(a)} ${C + popDy - r * Math.cos(a)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;

    return [
        `M ${pt(a0, r1)}`,
        `A ${r1} ${r1} 0 ${large} 1 ${pt(a1, r1)}`,
        `L ${pt(a1, r0)}`,
        `A ${r0} ${r0} 0 ${large} 0 ${pt(a0, r0)}`,
        'Z',
    ].join(' ');
}

/**
 * ชาร์ตที่ 5: วงแหวนสถานะแบบโต้ตอบ (G5 — Interactive SVG Status Donut)
 * คำนวณพิกัดมุมเรขาคณิต (Sine / Cosine) พร้อมลูกเล่น Pop-Out Effect และเชื่อมโยง Dropdown 2 ทาง
 * ตัวหนังสือ Regular ไม่เอา Bold ขนาดใหญ่ขึ้น
 */
export function StatusDonut({ totals }) {
    const total = totals.total || 0;
    const [activeKey, setActiveKey] = useState(null);

    // คำนวณช่วงมุมเรเดียนของแต่ละสถานะ (0 ถึง 2 * PI)
    let curAngle = 0;
    const slices = STAGES.map((stage) => {
        const n = totals[stage.key] || 0;
        const share = total > 0 ? n / total : 0;
        const sweep = share * 2 * Math.PI;

        const a0 = curAngle + GAP / 2;
        const a1 = curAngle + sweep - GAP / 2;
        curAngle += sweep;

        const isActive = activeKey === stage.key;
        const mid = (a0 + a1) / 2;
        const popDx = isActive ? POP * Math.sin(mid) : 0;
        const popDy = isActive ? -POP * Math.cos(mid) : 0;

        return {
            ...stage,
            count: n,
            percentage: share * 100,
            path: sweep > GAP ? sector(a0, a1, IN, R, popDx, popDy) : null,
            isActive,
            popDx,
            popDy,
        };
    });

    // ข้อมูลแสดงผลตรงกลางวงแหวน (Inner Hole)
    const activeStage = slices.find((s) => s.key === activeKey);
    const displayLabel = activeStage ? activeStage.label : 'สถานประกอบการทั้งหมด';
    const displayCount = activeStage ? activeStage.count : total;
    const displayPct = activeStage ? `${activeStage.percentage.toFixed(1)}%` : '100%';

    return (
        <div className="flex flex-col items-center">
            {/* ตัวเลือก Dropdown สองทาง (Two-way synchronization) */}
            <div className="w-full mb-4">
                <Select.Root
                    value={activeKey || 'all'}
                    onValueChange={(val) => setActiveKey(val === 'all' ? null : val)}
                >
                    <Select.Trigger className="w-full flex items-center justify-between text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-emerald-700 focus:outline-none transition font-normal">
                        <Select.Value placeholder="เลือกดูเฉพาะสถานะ" />
                        <Select.Icon>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Content className="z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden p-1.5 min-w-[240px]">
                            <Select.Viewport className="p-1 space-y-0.5">
                                <Select.Item
                                    value="all"
                                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer outline-none select-none font-normal"
                                >
                                    <Select.ItemText>แสดงสถานะรวมทั้งหมด</Select.ItemText>
                                    <Select.ItemIndicator>
                                        <Check className="w-4 h-4 text-emerald-700" />
                                    </Select.ItemIndicator>
                                </Select.Item>
                                {STAGES.map((s) => (
                                    <Select.Item
                                        key={s.key}
                                        value={s.key}
                                        className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer outline-none select-none font-normal"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                                            <Select.ItemText>{s.label}</Select.ItemText>
                                        </div>
                                        <Select.ItemIndicator>
                                            <Check className="w-4 h-4 text-emerald-700" />
                                        </Select.ItemIndicator>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </div>

            {/* วงแหวน SVG Donut ขนาดใหญ่ขึ้น (w-72 h-72) */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible">
                    {slices.map((slice) => {
                        if (!slice.path) return null;

                        return (
                            <path
                                key={slice.key}
                                d={slice.path}
                                fill={slice.color}
                                stroke="#ffffff"
                                strokeWidth={slice.isActive ? 3 : 1}
                                className="cursor-pointer transition-all duration-200 hover:brightness-105"
                                style={{
                                    filter: slice.isActive ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' : 'none',
                                }}
                                onMouseEnter={() => setActiveKey(slice.key)}
                                onClick={() => setActiveKey(activeKey === slice.key ? null : slice.key)}
                            />
                        );
                    })}
                </svg>

                {/* ข้อความและตัวเลขตรงกลางหลุมวงแหวน (Inner Hole) */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3"
                    style={{ width: `${IN * 2.2}px`, height: `${IN * 2.2}px`, margin: 'auto' }}
                >
                    <span className="text-xs font-normal text-slate-500 line-clamp-1">
                        {displayLabel}
                    </span>
                    <span className="text-3xl font-normal text-slate-900 my-0.5">
                        {displayCount}
                    </span>
                    <span className="text-xs font-normal text-emerald-700">
                        {displayPct}
                    </span>
                </div>
            </div>

            {/* คำอธิบายสัญลักษณ์ด้านล่าง (Interactive Legend) */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100 text-sm">
                {slices.map((slice) => (
                    <button
                        key={slice.key}
                        type="button"
                        onClick={() => setActiveKey(activeKey === slice.key ? null : slice.key)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition ${
                            slice.isActive ? 'bg-emerald-50 border border-emerald-200 shadow-2xs' : 'hover:bg-slate-50'
                        }`}
                    >
                        <span className="w-3 h-3 rounded-md shrink-0" style={{ background: slice.color }} />
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-normal text-slate-600 truncate">{slice.label}</div>
                            <div className="text-sm font-normal text-slate-800">
                                {slice.count} แห่ง <span className="text-slate-400 font-normal">({slice.percentage.toFixed(0)}%)</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
