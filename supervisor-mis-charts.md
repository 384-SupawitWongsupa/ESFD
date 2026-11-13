# ระบบสารสนเทศเพื่อการบริหาร (MIS) สำหรับผู้บริหาร: สถาปัตยกรรมกราฟิก CSS และไลบรารีชาร์ต
> **ระบบประเมินภาระงานครูโรงเรียนพานพิทยาคม (AWES)**  
> เอกสารข้อกำหนดด้านเทคนิค ดีไซน์ การคำนวณสถิติ CSS สไตล์ชีต และไลบรารีสำหรับชาร์ตและสารสนเทศบนหน้าแดชบอร์ดผู้บริหาร (Supervisor MIS Dashboard)

---

## 1. ภาพรวมระบบสารสนเทศเพื่อการบริหาร (MIS Dashboard Overview)

หน้าจอ **MIS Dashboard** (`/supervisor/dashboard`) มีวัตถุประสงค์เพื่อให้ผู้อำนวยการและรองผู้อำนวยการโรงเรียนพานพิทยาคมสามารถติดตามความคืบหน้าการส่งแบบประเมินผลการปฏิบัติงานของครูทั้งโรงเรียนได้อย่างทันท่วงที ถูกต้อง แม่นยำ และใช้สนับสนุนการตัดสินใจเชิงบริหารตามเกณฑ์ ว23/2564 (PA)

### ข้อมูลสารสนเทศหลัก 4 มิติที่แสดงผล:
1. **มิติภาพรวมทั้งโรงเรียน**: สัดส่วนความคืบหน้า 4 ขั้นตอนการประเมิน
2. **มิติรายกลุ่มสาระการเรียนรู้**: อัตราการส่งเทียบกับค่าเป้าหมายของโรงเรียน และการจำแนกกลุ่มที่ต้องติดตามเร่งรัด
3. **มิติจำนวนบุคลากร**: การกระจายตัวของภาระงานตามขนาดกลุ่มสาระ
4. **มิติผลสัมฤทธิ์การประเมิน**: การกระจายตัวของระดับผลการประเมิน 5 ระดับ (ดีเด่น, ดีมาก, ดี, พอใช้, ปรับปรุง) พร้อมคะแนนเฉลี่ย

---

## 2. ปรัชญาการพัฒนาชาร์ต (Zero-Dependency Chart Architecture)

ในระบบ AWES นี้ ทีมพัฒนาได้เลือกแนวทาง **Zero-Dependency Native Charting** (การสร้างชาร์ตด้วย HTML5 Div + Tailwind CSS v4 + Semantic SVG แท้) **โดยไม่พึ่งพาไลบรารีกราฟภายนอกขนาดใหญ่** (เช่น Chart.js, Recharts, ApexCharts หรือ ECharts)

### เหตุผลและข้อได้เปรียบทางวิศวกรรม:
| มิติการประเมิน | Native CSS/SVG (ที่ระบบใช้) | การใช้ Chart Library ภายนอก |
|---|---|---|
| **ขนาดไฟล์ (Bundle Size)** | **0 KB** (ใช้คลาส Tailwind ที่มีอยู่แล้ว) | เพิ่ม 150 KB – 500 KB+ (ทำให้หน้าโหลดช้าลง) |
| **การรองรับธีมโรงเรียน (Theming)** | เชื่อมโยงกับ CSS Variables สีม่วง-ขาว ได้ 100% | ต้อง override theme ของไลบรารีซึ่งซับซ้อน |
| **การพิมพ์เอกสาร (Print-Ready)** | คมชัด 100% ทุก DPI สไตล์ไม่เพี้ยน ไม่เกิด Blank Canvas | กราฟแบบ Canvas มักพิมพ์ไม่ติดหรือแตกเมื่อสั่งพิมพ์ |
| **การเข้าถึง (Accessibility - a11y)** | รองรับ Screen Reader เต็มรูปแบบด้วย `role="listitem"`, `aria-label` | ส่วนใหญ่เรนเดอร์ลง `<canvas>` ทำให้โปรแกรมอ่านหน้าจออ่านไม่ออก |
| **ความเข้ากันได้กับ React 19** | เข้ากันได้ 100% ทำงานร่วมกับ React Compiler ได้ทันที | ไลบรารีภายนอกหลายตัวยังติดปัญหา Peer Dependencies บน React 19 |
| **การปรับแต่ง Responsive** | ใช้ Container Query / Tailwind Breakpoints ได้อย่างอิสระ | มักติดปัญหา Re-layout และ Chart Resize Lag |

---

## 3. รายการไลบรารีที่ใช้งานจริง (Actual Libraries Used)

ถึงแม้ระบบจะไม่ได้ติดตั้ง Chart Engine สำเร็จรูป แต่มีการผสานการทำงานของไลบรารีสนับสนุนต่อไปนี้ในการควบคุมการโต้ตอบ (Interactions):

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@tailwindcss/vite": "^4.1.11",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-select": "^2.1.6",
    "lucide-react": "^0.475.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.1",
    "react-i18next": "^17.0.15"
  }
}
```

### หน้าที่ของแต่ละไลบรารีในหน้า MIS:
1. **`react` 19**: จัดการ Local State ของการเลือกชิ้นกราฟโดนัท (Active Slice), คำนวณพิกัดมุมเรขาคณิต (Trigonometry), และควบคุมการเลื่อนเคอร์เซอร์แสดงทูลทิป
2. **`@tailwindcss/vite` (Tailwind CSS v4)**: คอมไพล์ CSS Variables, ระบบ Grid/Flexbox, อัตราส่วนความกว้างแบบไดนามิก และมิติเงา
3. **`@radix-ui/react-select`**: คอมโพเนนต์ Dropdown ตัวเลือกสถานะที่เชื่อมโยงกับ SVG Donut Chart แบบ Two-way synchronization
4. **`lucide-react`**: ไอคอนสัญลักษณ์ความเสี่ยง เช่น `<TriangleAlert />` สำหรับเตือนกลุ่มสาระที่อัตราการส่งต่ำกว่าเกณฑ์ (< 50%)
5. **`react-i18next`**: การแปลป้ายชื่อสถานะและข้อความในทูลทิปแบบ 3 ภาษา (ไทย, อังกฤษ, จีน)

---

## 4. ระบบสีและการออกแบบสารสนเทศ (Data Visualization Palette)

ระบบใช้หลักการ **Single-Hue Ordinal Ramp** (การไล่ระดับความเข้มของเฉดสีเดียวตามลำดับขั้นของงาน) โดยอ้างอิงจาก **สีม่วงประจำโรงเรียนพานพิทยาคม** ซึ่งผ่านการทดสอบ Contrast Ratio และความถูกต้องตามหลัก Data Visualization

### 4.1 ตารางโทเค็นสีขั้นตอนการประเมิน (`STAGES`)

```typescript
// resources/js/components/supervisor/chart-kit.tsx
export const STAGES = [
    { key: 'not_started', label: 'ยังไม่เริ่ม', color: '#c4b5fd', text: '#2e1065' },
    { key: 'in_progress', label: 'อยู่ระหว่างจัดทำ (ยังไม่ส่ง)', color: '#8b5cf6', text: '#ffffff' },
    { key: 'submitted',   label: 'ส่งแล้ว รอประเมิน', color: '#5b21b6', text: '#ffffff' },
    { key: 'reviewed',    label: 'ประเมินแล้ว', color: '#2e1065', text: '#ffffff' },
] as const;
```

* **ยังไม่เริ่ม (`not_started`)**: สีม่วงอ่อนพาสเทล (`#c4b5fd` / Violet 300) ใช้ข้อความสีม่วงเข้มจัด (`#2e1065`) เพื่อให้อ่านออก
* **อยู่ระหว่างจัดทำ (`in_progress`)**: สีม่วงกลาง (`#8b5cf6` / Violet 500) ครอบคลุมทั้งแบบร่าง (`draft`) และแบบที่ส่งกลับแก้ไข (`returned`)
* **ส่งแล้ว รอประเมิน (`submitted`)**: สีม่วงรอยัลประจำโรงเรียน (`#5b21b6` / Violet 800)
* **ประเมินแล้ว (`reviewed`)**: สีม่วงเข้มลึก (`#2e1065` / Violet 950) แสดงถึงความสำเร็จสมบูรณ์ของกระบวนการ

### 4.2 โทเค็นสีแกน เส้นกริด และการแจ้งเตือน (`VIZ`)

```typescript
export const VIZ = {
    grid: '#e1e0d9',     // เส้นกริดแนวตั้ง 25%, 50%, 75%
    axis: '#c3c2b7',     // เส้นแกนฐานกราฟ
    target: '#52514e',   // เส้นประแสดงค่าเป้าหมายของสถานศึกษา (Target line)
    bar: '#7c3aed',      // สีแท่งกราฟเดี่ยวมาตรฐาน (Single-hue metric bar)
    critical: '#d03b3b', // สีแดงเตือนความเสี่ยง (Alert / Low rate < 50%)
    ink2: '#52514e',     // สีข้อความกำกับรอง / ตัวเลขสถิติ
    muted: '#898781',    // สีตัวเลขบอกสเกลแกน 0-100%
};
```

### 4.3 ป้ายกำกับสถานะภาพรวมกลุ่มสาระ (`OVERALL`)

| สถานะภาพรวม | เงื่อนไขการคำนวณ | สไตล์คลาส Tailwind | ความหมายเชิงบริหาร |
|---|---|---|---|
| **`all_reviewed`** | อัตราการส่ง 100% และ ผอ. ยืนยันผลครบทุกคน | `bg-green-700 text-white` | ประเมินเสร็จสิ้นสมบูรณ์ |
| **`all_submitted`**| อัตราการส่ง 100% (ครูส่งครบทุกคน) | `bg-green-100 text-green-800` | ส่งครบแล้ว รอผู้บริหารตรวจ |
| **`almost`**       | อัตราการส่ง 80.0% – 99.9% | `bg-lime-100 text-lime-800` | ใกล้ครบตามเป้าหมาย |
| **`in_progress`**  | อัตราการส่ง 50.0% – 79.9% | `bg-amber-400 text-amber-950` | อยู่ระหว่างดำเนินการตามปกติ |
| **`needs_attention`**| อัตราการส่งต่ำกว่า 50.0% | `bg-red-100 text-red-800` | **ต้องติดตามเร่งรัดเป็นพิเศษ** |

---

## 5. สถาปัตยกรรมชาร์ตทั้ง 5 ชนิดบนหน้า MIS

ทุกชาร์ตได้รับการบรรจุอยู่ในการ์ดพาเนลมาตรฐาน `<ChartCard title="..." aside="..." note="...">` ซึ่งใช้เงาซ้อนเฉดม่วงและพื้นหลังสีขาวนวลตาม Design System

---

### ชาร์ตที่ 1: แถบสถานะทั้งโรงเรียน (G1 — School Status Bar)
* **ไฟล์คอมโพเนนต์**: `resources/js/components/supervisor/status-charts.tsx` (`SchoolStatusBar`)
* **เทคนิค CSS**: Single 100% Flexbox Bar แบ่งออกเป็น 4 ส่วนย่อยตามสัดส่วนร้อยละ
* **คุณสมบัติพิเศษ**:
  * ขอบมนทั้งแถบ (`rounded overflow-hidden h-10`)
  * มีช่องไฟคั่นระหว่างสถานะ 2px (`gap-[2px]`)
  * ถ้าพื้นที่ส่วนนั้นกว้างเกิน 12% จะแสดงข้อความ `n คน (x%)` ด้านใน แต่ถ้ากว้าง 3-12% จะแสดงเฉพาะตัวเลข `n` และถ้าแคบกว่า 3% จะซ่อนข้อความเพื่อไม่ให้ล้น

```tsx
<div className="flex h-10 gap-[2px] overflow-hidden rounded" role="list">
  {STAGES.map((stage) => {
    const share = pct(n, totals.total);
    return (
      <div
        key={stage.key}
        style={{ width: `${share}%`, background: stage.color, color: stage.text }}
        className="flex items-center justify-center text-xs font-semibold whitespace-nowrap hover:brightness-110"
      >
        {share >= 12 ? `${n} คน (${share.toFixed(0)}%)` : share >= 3 ? n : ''}
      </div>
    );
  })}
</div>
```

---

### ชาร์ตที่ 2: อัตราการส่งรายกลุ่มสาระ (G2 — Submission Rate Chart)
* **ไฟล์คอมโพเนนต์**: `resources/js/components/supervisor/status-charts.tsx` (`SubmissionRateChart`)
* **เทคนิค CSS**: Relative Positioning ร่วมกับ CSS Variables `--lw` สำหรับปรับความกว้างคอลัมน์ชื่อกลุ่มสาระอัตโนมัติตามขนาดหน้าจอ
* **คุณสมบัติพิเศษ**:
  * เรียงลำดับจากอัตราการส่งน้อยไปมาก เพื่อให้ผู้บริหารมองเห็นกลุ่มที่วิกฤตอยู่ด้านบนสุดทันที
  * **เส้นประเป้าหมาย (Target Line)**: `borderLeft: 2px dashed #52514e` วางตำแหน่งแบบไดนามิกตามค่า `targetPercent` (เช่น 80% หรือ 68%)
  * **เส้นกริดโปร่งแสง**: วางที่ตำแหน่ง 0%, 25%, 50%, 75%, 100%
  * **ป้ายเตือนอัตโนมัติ**: หากกลุ่มใดต่ำกว่า 50% จะแสดงข้อความสีแดงพร้อมไอคอน `TriangleAlert` ท้ายแท่ง
  * คลิกที่แถบเพื่อเจาะลึก (Drill-down) ดูกลุ่มสาระนั้นได้ทันที

```tsx
/* CSS Variable ปรับความกว้างคอลัมน์ชื่อกลุ่มสาระ (มือถือ 7.5rem, จอใหญ่ 11rem) */
const LABEL_W = '[--lw:7.5rem] sm:[--lw:11rem]';

{/* เส้นประเป้าหมายโรงเรียน */}
<div
  className="absolute inset-y-0"
  style={{ left: `${target}%`, borderLeft: `2px dashed ${VIZ.target}` }}
/>

{/* แท่งความคืบหน้า */}
<span
  className="absolute top-1.5 left-0 h-4"
  style={{
    width: `${Math.max(row.submissionRate, 0.5)}%`,
    background: VIZ.bar,
    borderRadius: '0 4px 4px 0',
  }}
/>
```

---

### ชาร์ตที่ 3: สถานะรายกลุ่มสาระแบบแท่งซ้อน (G3 — Department Stack Chart)
* **ไฟล์คอมโพเนนต์**: `resources/js/components/supervisor/status-charts.tsx` (`DepartmentStackChart`)
* **เทคนิค CSS**: Proportional Stacked Horizontal Bars
* **คุณสมบัติพิเศษ**:
  * ความยาวรวมของแต่ละแท่งจะแปรผันตาม **"จำนวนครูจริงในกลุ่มสาระนั้น"** เทียบกับกลุ่มที่มีครูมากที่สุด (`row.total / maxTotal`) ทำให้ผู้บริหารประเมินสัดส่วนขนาดของกลุ่มงานได้ด้วยสายตา
  * ภายในแท่งแบ่งสัดส่วนด้วย CSS `flex: n` ตามจำนวนครูในแต่ละสถานะ

```tsx
<span
  className="flex h-5 gap-[2px] overflow-hidden rounded"
  style={{ width: `calc((100% - 3.5rem) * ${row.total / max})` }}
>
  {STAGES.map((stage) => (
    <span
      key={stage.key}
      style={{ flex: n, background: stage.color, color: stage.text }}
      className="flex items-center justify-center text-xs font-semibold"
    >
      {n / max >= 0.08 ? n : ''}
    </span>
  ))}
</span>
```

---

### ชาร์ตที่ 4: สัดส่วนระดับผลการประเมิน 5 ระดับ (G4 — Result Level Chart)
* **ไฟล์คอมโพเนนต์**: `resources/js/components/supervisor/status-charts.tsx` (`ResultLevelChart`)
* **เทคนิค CSS**: Vertical Column Chart บนแกนแนวนอน
* **คุณสมบัติพิเศษ**:
  * แสดงการกระจายตัวของผลการประเมิน 5 ระดับ: **ดีเด่น, ดีมาก, ดี, พอใช้, ปรับปรุง**
  * คอนเทนเนอร์ใช้ `flex items-end` ความสูง 224px (`h-56`)
  * ปลายแท่งด้านบนโค้งมนมน (`rounded-t`), มีตัวเลขจำนวนคนกำกับบนหัวแท่งเสมอ
  * เมื่อนำเมาส์ชี้ จะแสดงสัดส่วนเปอร์เซ็นต์ผ่าน Tooltip

```tsx
<div className="flex h-56 items-end gap-4 border-b px-2" style={{ borderColor: VIZ.axis }}>
  {entries.map(([level, n]) => (
    <div key={level} className="flex h-full flex-1 flex-col items-center justify-end">
      <span className="mb-1 text-sm font-semibold tabular-nums">{n} คน</span>
      <span
        className="w-full max-w-16"
        style={{
          height: `${(n / max) * 85}%`,
          minHeight: n ? 4 : 0,
          background: VIZ.bar,
          borderRadius: '4px 4px 0 0',
        }}
      />
    </div>
  ))}
</div>
```

---

### ชาร์ตที่ 5: วงแหวนสถานะแบบโต้ตอบ (Interactive SVG Status Donut)
* **ไฟล์คอมโพเนนต์**: `resources/js/components/supervisor/status-donut.tsx` (`StatusDonut`)
* **เทคนิคเรขาคณิต**: Pure SVG Path Math (Trigonometry: Sine / Cosine)
* **คุณสมบัติพิเศษ**:
  * คำนวณเส้นทาง SVG Path แบบเสี้ยววงแหวน (Ring Sector) จากมุมเรเดียน $a_0$ ถึง $a_1$
  * มีร่องตัดแยกชิ้นละ 2px (`GAP = 0.012 rad`)
  * **เอฟเฟกต์ Pop-Out**: เมื่อเลื่อนเมาส์ชี้หรือเลือกชิ้นพายผ่าน Dropdown ชิ้นนั้นจะขยายรัศมีออกไปด้านนอกอีก 8px (`POP = 8`) พร้อมขอบเน้นสีขาว
  * **หลุมตรงกลาง (Inner Hole)**: แสดงชื่อสถานะที่เลือก จำนวนคน และสัดส่วนเปอร์เซ็นต์อย่างชัดเจน

```typescript
// การคำนวณพิกัดชิ้นพายวงแหวน
const C = 120; // จุดกึ่งกลางใน ViewBox 240x240
const R = 84;  // รัศมีรอบนอก
const IN = 50; // รัศมีรูตรงกลาง

function sector(a0: number, a1: number, r0: number, r1: number): string {
    const pt = (a: number, r: number) =>
        `${C + r * Math.sin(a)} ${C - r * Math.cos(a)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;

    return [
        `M ${pt(a0, r1)}`,
        `A ${r1} ${r1} 0 ${large} 1 ${pt(a1, r1)}`,
        `L ${pt(a1, r0)}`,
        `A ${r0} ${r0} 0 ${large} 0 ${pt(a0, r0)}`,
        'Z',
    ].join(' ');
}
```

---

## 6. สถาปัตยกรรมระบบ Tooltip ไร้ไลบรารี (`ChartTooltip`)

การแสดงข้อมูลเมื่อ Hover หรือกด Tab โฟกัสถูกจัดการผ่าน Custom React Hook ใน `resources/js/components/supervisor/chart-kit.tsx`:

```typescript
export function useChartTooltip() {
    const [tip, setTip] = useState<{
        title: string;
        items: { label: string; value: string; color?: string }[];
        x: number;
        y: number;
    } | null>(null);

    const bind = (title: string, items: { label: string; value: string; color?: string }[]) => ({
        onPointerEnter: (e: PointerEvent) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTip({ title, items, x: rect.left + rect.width / 2, y: rect.top });
        },
        onPointerLeave: () => setTip(null),
        onFocus: (e: FocusEvent) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTip({ title, items, x: rect.left + rect.width / 2, y: rect.top });
        },
        onBlur: () => setTip(null),
    });

    return { tip, bind };
}
```

### จุดเด่นด้าน UX ของ Tooltip:
1. **ป้องกันข้อความล้นจอ**: มีการใช้ `translate-x-[-50%]` และ `translate-y-[-100%]` ลอยอยู่เหนือจุดชี้เสมอ
2. **ความปลอดภัยของเนื้อหา**: ส่งค่าผ่าน JSX ธรรมดา (หลีกเลี่ยง `dangerouslySetInnerHTML` 100%)
3. **รองรับ Keyboard Navigation**: ใช้งานร่วมกับ `onFocus` และ `onBlur` เพื่อให้ผู้พิการทางสายตาหรือผู้ใช้คีย์บอร์ดสามารถกดแท็บเพื่ออ่านข้อมูลได้

---

## 7. Responsive Layout และการปรับแต่งเพื่อการพิมพ์ (Print Optimization)

### 7.1 โครงสร้าง Responsive Grid บนแดชบอร์ด
```tsx
{/* แถวที่ 1: สถานะทั้งโรงเรียน (เต็มความกว้าง) */}
<ChartCard title="สถานะแบบประเมินทั้งโรงเรียน">
  <SchoolStatusBar totals={totals} />
</ChartCard>

{/* แถวที่ 2: แบ่ง 2 คอลัมน์บนจอใหญ่ (xl:grid-cols-2) */}
<div className="grid gap-6 xl:grid-cols-2">
  <ChartCard title="อัตราการส่งรายกลุ่มสาระ">...</ChartCard>
  <ChartCard title="สถานะรายกลุ่มสาระ (จำนวนคน)">...</ChartCard>
</div>

{/* แถวที่ 3: เลย์เอาต์แบบ 3 ส่วนบนจอ 2K (2xl:grid-cols-[340px_minmax(0,1fr)_400px]) */}
<div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[340px_minmax(0,1fr)_400px]">
  <ChartCard title="สัดส่วนสถานะแบบประเมิน"><StatusDonut totals={totals} /></ChartCard>
  <ChartCard title="ระดับผลการประเมิน"><ResultLevelChart levels={props.resultLevels} /></ChartCard>
  <div className="space-y-6">{/* คิวงานรอตรวจของผู้อำนวยการ */}</div>
</div>
```

### 7.2 การพิมพ์รายงานสารสนเทศ (Print Styling)
* เมื่อผู้บริหารกดพิมพ์หน้านี้ (Print / PDF) ส่วนควบคุมที่ไม่ได้ใช้จะถูกซ่อนอัตโนมัติด้วยคลาส `print:hidden` (เช่น เมนูตัวกรอง Dropdown และปุ่มคลิกต่างๆ)
* ชาร์ตทุกตัวถูกออกแบบด้วย CSS Vector (Flexbox + SVG) จึงทำให้ผลงานพิมพ์ออกทางเครื่องพิมพ์มีความคมชัดระดับ 300+ DPI ไม่เบลอหรือแตกเหมือนการใช้ไลบรารีแบบ HTML Canvas

---

## 8. ภาคผนวก: การเปรียบเทียบและการติดตั้งไลบรารีภายนอก (หากต้องการขยายในอนาคต)

หากในอนาคตมีข้อกำหนดจากโรงเรียนที่ต้องการชาร์ตชนิดพิเศษที่มีความซับซ้อนสูง (เช่น Radar Chart วิเคราะห์สมรรถนะครู 15 ตัวชี้วัด หรือ Spline Area Chart การเข้าใช้งานย้อนหลัง 12 เดือน) สามารถติดตั้งไลบรารีเพิ่มเติมได้ตามคำแนะนำด้านล่าง:

### ตารางเปรียบเทียบตัวเลือกไลบรารี

| ไลบรารี | คำสั่งติดตั้ง | ข้อดี | ข้อควรระวังในโปรเจกต์นี้ |
|---|---|---|---|
| **Shadcn Chart** *(แนะนำอันดับ 1)* | `npx shadcn@latest add chart` (ฐาน Recharts) | สไตล์เข้ากับ shadcn/ui ที่มีอยู่แล้วในโปรเจกต์ ใช้โทเค็นสีเดียวกัน | ต้องตรวจสอบความเข้ากันได้กับ React 19 (`--legacy-peer-deps`) |
| **Recharts** | `npm install recharts` | ใช้งานแบบ React Component แท้ รองรับ SVG Declarative | Bundle size ~400 KB |
| **Chart.js + react-chartjs-2** | `npm install chart.js react-chartjs-2` | ประสิทธิภาพสูงบนชุดข้อมูลขนาดใหญ่มาก | พิมพ์ออกกระดาษแตกง่ายเพราะเป็น HTML Canvas |

> 💡 **ข้อเสนอแนะเชิงสถาปัตยกรรม**: แนะนำให้คงสถาปัตยกรรม **Native CSS/SVG ของปัจจุบันไว้** เนื่องจากตรงตามโจทย์ความเร็ว ความเบา ความสวยงามตามอัตลักษณ์โรงเรียนพานพิทยาคม และมีความเสถียรสูงสุดโดยไม่มีปัญหา Dependency ภายนอก

