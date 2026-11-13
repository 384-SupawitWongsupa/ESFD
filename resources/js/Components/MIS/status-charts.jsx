import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { STAGES, VIZ, pct, useChartTooltip, ChartTooltip } from './chart-kit';

/**
 * ชาร์ตที่ 1: แถบสถานะภาพรวมทั้งตำบล (G1 — Sub-district Status Bar)
 * ใช้ Single 100% Flexbox Bar แบ่งออกเป็น 4 ส่วนย่อยตามสัดส่วนร้อยละ
 * ตัวหนังสือเป็นตัว Regular ธรรมดา ใช้ Noto Sans Thai ขนาดอ่านง่าย ชัดเจน
 */
export function SubDistrictStatusBar({ totals }) {
    const { tip, bind } = useChartTooltip();
    const total = totals.total || 0;

    return (
        <div className="space-y-5">
            <div className="flex h-14 gap-[2px] overflow-hidden rounded-xl bg-slate-100 p-1 border border-slate-200" role="list">
                {STAGES.map((stage) => {
                    const n = totals[stage.key] || 0;
                    const share = pct(n, total);

                    return (
                        <div
                            key={stage.key}
                            style={{
                                width: `${Math.max(share, 0)}%`,
                                background: stage.color,
                                color: stage.text,
                            }}
                            className="flex items-center justify-center text-sm font-normal whitespace-nowrap transition-all hover:brightness-105 cursor-pointer select-none rounded-lg"
                            {...bind(stage.label, [
                                { label: 'จำนวนสถานประกอบการ', value: `${n} แห่ง`, color: stage.color },
                                { label: 'สัดส่วนจากทั้งหมด', value: `${share.toFixed(1)}%` },
                            ])}
                        >
                            {share >= 14 ? `${n} แห่ง (${share.toFixed(0)}%)` : share >= 4 ? `${n} แห่ง` : ''}
                        </div>
                    );
                })}
            </div>

            {/* คำอธิบายสัญลักษณ์ (Legend) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-sm">
                {STAGES.map((stage) => {
                    const n = totals[stage.key] || 0;
                    const share = pct(n, total);
                    return (
                        <div key={stage.key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs" style={{ background: stage.color }} />
                            <div className="min-w-0">
                                <div className="text-xs font-normal text-slate-500 truncate">{stage.label}</div>
                                <div className="text-sm font-normal text-slate-800 mt-0.5">
                                    {n} แห่ง <span className="text-slate-400 font-normal">({share.toFixed(1)}%)</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ChartTooltip tip={tip} />
        </div>
    );
}

/**
 * ชาร์ตที่ 2: อัตราการดำเนินงานและออกตรวจรายประเภทกิจการ (G2 — Rate Chart)
 * เรียงลำดับจากอัตราน้อยไปมาก เพื่อให้ผู้บริหารมองเห็นหมวดที่ต้องติดตามเร่งรัดอยู่ด้านบนสุดทันที
 * ตัวหนังสือ Regular ไม่เอา Bold ขนาดแท่งใหญ่ขึ้น
 */
export function CategoryProgressRateChart({ categories, target = 80, onSelectCategory }) {
    const { tip, bind } = useChartTooltip();

    // เรียงจากอัตราน้อยไปมาก (น้อยสุดอยู่บนสุดตามข้อกำหนด MIS)
    const sorted = [...categories].sort((a, b) => a.submissionRate - b.submissionRate);

    return (
        <div className="space-y-5">
            {/* สเกลและเส้นกริดด้านบน */}
            <div className="relative pl-40 sm:pl-56 pr-20 h-6 flex items-end">
                {[0, 25, 50, 75, 100].map((tick) => (
                    <span
                        key={tick}
                        className="absolute text-xs font-normal text-slate-400 -translate-x-1/2"
                        style={{ left: `calc(10rem + (100% - 15rem) * ${tick / 100})` }}
                    >
                        {tick}%
                    </span>
                ))}
            </div>

            <div className="space-y-3">
                {sorted.map((row) => {
                    const isAlert = row.submissionRate < 50;

                    return (
                        <div
                            key={row.id}
                            onClick={() => onSelectCategory && onSelectCategory(row.id)}
                            className="group flex items-center gap-3.5 py-1.5 cursor-pointer hover:bg-slate-50/80 rounded-xl px-2.5 transition"
                            {...bind(row.name, [
                                { label: 'สถานประกอบการทั้งหมด', value: `${row.total} แห่ง` },
                                { label: 'ตรวจผ่าน/ออกใบอนุญาตแล้ว', value: `${row.completed + (row.pending_print || 0)} แห่ง`, color: VIZ.bar },
                                { label: 'อัตราความคืบหน้า', value: `${row.submissionRate}%` },
                                { label: 'เป้าหมายท้องถิ่น', value: `${target}%` },
                            ])}
                        >
                            {/* ชื่อหมวดหมู่ */}
                            <div className="w-36 sm:w-52 text-sm font-normal text-slate-800 truncate group-hover:text-emerald-800 transition">
                                {row.name}
                            </div>

                            {/* คอนเทนเนอร์แถบกราฟ */}
                            <div className="relative flex-1 h-8 bg-slate-100 rounded-xl overflow-hidden border border-slate-200/80">
                                {/* เส้นกริดแนวตั้ง 25%, 50%, 75% */}
                                {[25, 50, 75].map((g) => (
                                    <div
                                        key={g}
                                        className="absolute inset-y-0 border-r border-slate-200"
                                        style={{ left: `${g}%` }}
                                    />
                                ))}

                                {/* เส้นประแสดงค่าเป้าหมาย (Target line) */}
                                <div
                                    className="absolute inset-y-0 z-10"
                                    style={{ left: `${target}%`, borderLeft: `2px dashed ${VIZ.target}` }}
                                    title={`เป้าหมายท้องถิ่น ${target}%`}
                                />

                                {/* แท่งความคืบหน้า */}
                                <div
                                    className="h-full rounded-r-lg transition-all group-hover:brightness-110"
                                    style={{
                                        width: `${Math.max(row.submissionRate, 1)}%`,
                                        background: isAlert ? VIZ.critical : VIZ.bar,
                                    }}
                                />
                            </div>

                            {/* ตัวเลขเปอร์เซ็นต์และป้ายแจ้งเตือน */}
                            <div className="w-24 text-right shrink-0 flex items-center justify-end gap-1.5">
                                <span className={`text-sm font-normal ${isAlert ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {row.submissionRate}%
                                </span>
                                {isAlert && (
                                    <span
                                        className="p-1 rounded-md bg-rose-100 text-rose-700 inline-flex items-center"
                                        title="อัตราต่ำกว่า 50% ต้องติดตามเร่งรัด"
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* บันทึกอธิบายเส้นเป้าหมาย */}
            <div className="flex flex-wrap items-center justify-between text-xs font-normal text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="w-3.5 border-b-2 border-dashed border-slate-600 inline-block" />
                    <span>เส้นประแสดงค่าเป้าหมายของ อบต. ({target}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ต่ำกว่า 50% ต้องติดตามเร่งรัด</span>
                </div>
            </div>

            <ChartTooltip tip={tip} />
        </div>
    );
}

/**
 * ชาร์ตที่ 3: สถานะรายประเภทกิจการแบบแท่งซ้อน (G3 — Department/Category Stack Chart)
 * ความยาวรวมของแต่ละแท่งจะแปรผันตามจำนวนสถานประกอบการจริง เทียบกับกลุ่มที่มีมากที่สุด
 * ฟอนต์ Regular ธรรมดา ขนาดแท่งใหญ่ขึ้น
 */
export function CategoryStackChart({ categories }) {
    const { tip, bind } = useChartTooltip();
    const maxTotal = Math.max(...categories.map((c) => c.total), 1);

    return (
        <div className="space-y-4">
            {categories.map((row) => {
                const barRatio = row.total / maxTotal;

                return (
                    <div
                        key={row.id}
                        className="space-y-1.5"
                        {...bind(row.name, [
                            { label: 'จำนวนทั้งหมด', value: `${row.total} แห่ง` },
                            { label: 'ยื่นคำขอใหม่', value: `${row.pending_request || 0} แห่ง`, color: STAGES[0].color },
                            { label: 'รอตรวจสุขลักษณะ', value: `${row.pending_inspection || 0} แห่ง`, color: STAGES[1].color },
                            { label: 'รอพิมพ์ใบอนุญาต', value: `${row.pending_print || 0} แห่ง`, color: STAGES[2].color },
                            { label: 'ปกติ/ออกใบอนุญาตแล้ว', value: `${row.completed || 0} แห่ง`, color: STAGES[3].color },
                        ])}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-normal text-slate-800 truncate max-w-[220px] sm:max-w-[320px]">
                                {row.name}
                            </span>
                            <span className="text-sm font-normal text-slate-500">{row.total} แห่ง</span>
                        </div>

                        {/* แถบ Proportional Stacked */}
                        <div className="w-full bg-slate-100 rounded-xl p-1 border border-slate-200 flex items-center">
                            <div
                                className="flex h-7 gap-[2px] overflow-hidden rounded-lg transition-all"
                                style={{ width: `${Math.max(barRatio * 100, 5)}%` }}
                            >
                                {STAGES.map((stage) => {
                                    const n = row[stage.key] || 0;
                                    if (n <= 0) return null;

                                    return (
                                        <div
                                            key={stage.key}
                                            style={{
                                                flex: n,
                                                background: stage.color,
                                                color: stage.text,
                                            }}
                                            className="flex items-center justify-center text-xs font-normal"
                                        >
                                            {n / maxTotal >= 0.08 ? n : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}

            <ChartTooltip tip={tip} />
        </div>
    );
}

/**
 * ชาร์ตที่ 4: สัดส่วนระดับผลและระยะเวลาสิ้นอายุใบอนุญาต 5 ระดับ (G4 — Result Level Chart)
 * Vertical Column Chart บนแกนแนวนอน ขยายความสูงเป็น h-64 sm:h-72
 * ตัวหนังสือ Regular ไม่เอา Bold
 */
export function ResultLevelChart({ levels }) {
    const { tip, bind } = useChartTooltip();
    const entries = Object.entries(levels || {});
    const max = Math.max(...entries.map(([_, item]) => item.count), 1);

    return (
        <div className="space-y-4">
            <div className="flex h-64 sm:h-72 items-end gap-3 sm:gap-6 border-b px-2 pb-1.5" style={{ borderColor: VIZ.axis }}>
                {entries.map(([key, item]) => {
                    const ratio = item.count / max;
                    const heightPct = Math.round(ratio * 82);

                    return (
                        <div
                            key={key}
                            className="flex h-full flex-1 flex-col items-center justify-end cursor-pointer group"
                            {...bind(item.label, [
                                { label: 'จำนวนสถานประกอบการ', value: `${item.count} แห่ง`, color: item.color },
                                { label: 'สัดส่วนสัมพัทธ์', value: `${Math.round(ratio * 100)}%` },
                            ])}
                        >
                            <span className="mb-2 text-sm font-normal tabular-nums text-slate-800 group-hover:text-emerald-800 transition">
                                {item.count} แห่ง
                            </span>
                            <span
                                className="w-full max-w-16 sm:max-w-20 transition-all group-hover:brightness-110 shadow-xs"
                                style={{
                                    height: `${heightPct}%`,
                                    minHeight: item.count > 0 ? 10 : 3,
                                    background: item.color || VIZ.bar,
                                    borderRadius: '8px 8px 0 0',
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* ป้ายชื่อกำกับใต้แกน */}
            <div className="grid grid-cols-5 gap-1 sm:gap-4 text-center pt-1">
                {entries.map(([key, item]) => (
                    <div key={key} className="text-xs sm:text-sm font-normal text-slate-600 line-clamp-2 px-0.5">
                        {item.label}
                    </div>
                ))}
            </div>

            <ChartTooltip tip={tip} />
        </div>
    );
}
