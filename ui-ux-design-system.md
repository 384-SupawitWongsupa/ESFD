# คู่มือระบบการออกแบบ UX/UI, CSS, Tailwind และ UI Libraries
> **ระบบประเมินภาระงานครูโรงเรียนพานพิทยาคม (AWES)**  
> เอกสารรวบรวมมาตรฐานการออกแบบอินเทอร์เฟซ โทเค็นสี สไตล์ชีต คอมโพเนนต์ และไลบรารีส่วนหน้าทั้งหมดของระบบ

---

## 1. สถาปัตยกรรมส่วนหน้า (Frontend Architecture Overview)

ระบบส่วนหน้าพัฒนาขึ้นบนสถาปัตยกรรมแบบ Single Page Application (SPA) สมัยใหม่ โดยเชื่อมต่อกับ Laravel ผ่าน Inertia.js v3 เพื่อมอบประสบการณ์การใช้งานที่ลื่นไหลระดับแอปพลิเคชันเดสก์ท็อป โดยไม่มีภาระในการจัดการ API REST/GraphQL แยกต่างหาก

| องค์ประกอบ | เทคโนโลยี / เวอร์ชัน | หน้าที่และจุดเด่น |
|---|---|---|
| **Core UI Framework** | **React 19** (`^19.2.0`) | รองรับ React Server Features, Action State และ Concurrency |
| **Compiler Optimization** | **React Compiler** (`babel-plugin-react-compiler`) | คอมไพล์และแคชการเรนเดอร์อัตโนมัติ (Zero manual `useMemo` / `useCallback`) |
| **Fullstack Bridge** | **Inertia.js v3** (`@inertiajs/react`) | นำส่ง State และ Props จาก Laravel สู่ React โดยตรง ไม่ต้องเขียน API endpoint แยก |
| **Bundler & Build Tool** | **Vite 8** + **Vite Plus** (`vite-plus`) | บิลด์ด้วยความเร็วสูง พร้อมระบบ Lazy Loading และ Type-aware Linting |
| **Type Safety** | **TypeScript 5.7+** | Type-safe ตลอดทั้งโปรเจกต์ ทั้ง Props, Route, Shared data และ Database models |
| **Routing Helper** | **Laravel Wayfinder** (`@laravel/vite-plugin-wayfinder`) | สร้าง Type-safe helper สำหรับ Laravel Routes และ Form Variants ฝั่งไคลเอนต์ |
| **Internationalization** | **i18next** + **react-i18next** | รองรับ 3 ภาษา (ไทย TH, อังกฤษ EN, จีน ZH) แบบ Dynamic context |

---

## 2. ระบบ CSS และสไตล์ชีต (Tailwind CSS v4 & Modern CSS)

โปรเจกต์นี้เลือกใช้ **Tailwind CSS เวอร์ชัน 4** ซึ่งปรับเปลี่ยนสถาปัตยกรรมสู่ **CSS-First Configuration** โดยตั้งค่าทั้งหมดโดยตรงใน `resources/css/app.css` (แทนการใช้ไฟล์ `tailwind.config.js` แบบเดิม)

### 2.1 โครงสร้างการนำเข้าและคอมไพล์ (`app.css`)
```css
@import 'tailwindcss';
@import 'tw-animate-css';

@source '../views';
@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';

/* นโยบาย Light Mode Only: บล็อก dark: variant ไม่ให้ทำงานตาม OS */
@custom-variant dark (&:is(.dark *));
```

### 2.2 นโยบายการแสดงผล (Light Mode Only Policy)
* **โรงเรียนกำหนดให้ใช้ธีมสว่าง (Light Theme) เท่านั้น**: เพื่อความสม่ำเสมอในการพิมพ์เอกสารราชการและการแสดงผลบนหน้าจออุปกรณ์ของครู
* มีการระบุ `<meta name="color-scheme" content="light">` ใน `app.blade.php`
* มีการใช้คำสั่ง `@custom-variant dark (&:is(.dark *));` เพื่อป้องกันไม่ให้คลาส `dark:` ของ shadcn/ui ติดขึ้นมาเมื่อเบราว์เซอร์หรือระบบปฏิบัติการของผู้ใช้เปิด Dark Mode

### 2.3 ยูทิลิตี้จัดการ Class Names (`cn`)
ใช้รูปแบบมาตรฐานของ shadcn/ui โดยรวม `clsx` และ `tailwind-merge` ไว้ที่ `resources/js/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

---

## 3. ระบบสีและโทเค็นการออกแบบ (Color Identity & Design Tokens)

อัตลักษณ์การออกแบบอ้างอิงจาก **"สีม่วง - ขาว"** ซึ่งเป็นสีประจำโรงเรียนพานพิทยาคม โดยเน้นสีม่วงรอยัล (Royal Purple) เป็นจุดเด่น บนพื้นหลังสีขาวนวลแบบ Neutral ที่อ่านง่าย ไม่ล้าสายตา

### 3.1 ตารางโทเค็นสีหลัก (Semantic Color Tokens)

| โทเค็น (Token) | ค่าสี (HEX / OKLCH) | ตัวอย่างการใช้งาน |
|---|---|---|
| `--primary` | `#5b21b6` (Purple 800) | สีหลักของระบบ, ปุ่ม Action สำคัญ, ขอบโฟกัส, แท็บบาร์ |
| `--primary-foreground` | `#ffffff` | ข้อความบนพื้นหลังสีม่วง |
| `--primary-container` | `#6d28d9` (Purple 700) | กล่องไฮไลต์ส่วนหัว, การ์ดสถานะที่มีความสำคัญ |
| `--on-primary-container`| `#f5f0ff` | ข้อความบนคอนเทนเนอร์สีม่วง |
| `--background` | `#f5f6f8` | พื้นหลังของทั้งหน้าจอ (Off-white สะอาด สบายตา) |
| `--card` | `#ffffff` | พื้นหลังของการ์ด, พาเนล, ตารางข้อมูล |
| `--foreground` | `#1b1c22` | สีข้อความหลัก คมชัด อ่านง่ายตามมาตรฐาน Contrast ratio |
| `--muted` | `#f1f2f5` | พื้นหลังส่วนรอง, แถบสถานะย่อย |
| `--muted-foreground` | `#4b4f5a` | ข้อความรอง, วันที่, คำอธิบายเพิ่มเติม |
| `--border` | `#e1e3e8` | เส้นขอบการ์ด เส้นคั่น และขอบตาราง |
| `--input` | `#d5d8de` | เส้นขอบกล่องกรอกข้อมูล (Input border) |
| `--destructive` | `#ba1a1a` | ปุ่มลบ, แจ้งเตือนข้อผิดพลาด, ข้อความเตือนความเสี่ยง |
| `--error-container` | `#ffdad6` | พื้นหลังแถบแจ้งเตือนความผิดพลาด |

### 3.2 สีสัญญาณและการแจ้งเตือน (Notice & Accent Amber)
เพื่อไม่ให้สีเหลืองดูแย่งความสนใจหรือแสบตา (Neon) ระบบจึงกำหนดสีเหลืองนวลโทนอุ่น (Soft Warm Yellow) โดยเฉพาะ:
* `--color-amber-400`: `#fbe3a0` (แถบแจ้งเตือน, ป้าย "ใหม่", ไฮไลต์การเลือก)
* `--color-amber-500`: `#f2cf73` (เส้นขอบเตือน)
* ตัวอักษรบนพื้นสีเตือน: ใช้ `text-amber-950` เสมอ เพื่อให้อ่านออกได้ชัดเจน

### 3.3 แถบสัญลักษณ์หัวหน้า (`.page-title`)
ทุกหน้าของระบบจะมีแท่งสีม่วงมนหนา 4px อยู่ด้านหน้าชื่อเรื่องหลัก (`| ภาพรวม…`):
```css
.page-title {
    position: relative;
    padding-left: 0.875rem;
}
.page-title::before {
    content: '';
    position: absolute;
    top: 0.15em;
    bottom: 0.15em;
    left: 0;
    width: 4px;
    border-radius: 9999px;
    background: var(--primary);
}
```

---

## 4. ระบบตัวอักษรและมิติเงา (Typography, Depth & Elevation)

### 4.1 ระบบตัวอักษร (Typography System)
* **ฟอนต์หลัก**: **`Kanit`** (Google Fonts) ซึ่งโหลดผ่าน `laravel-vite-plugin/fonts` ใน `vite.config.ts` น้ำหนัก: `300`, `400`, `500`, `600`, `700` รองรับชุดอักขระ `thai` และ `latin`
* **ฟอนต์สำรองสำหรับภาษาจีน (CJK Fallbacks)**: `'PingFang SC'`, `'Hiragino Sans GB'`, `'Microsoft YaHei'`, `'Noto Sans SC'` (รองรับระบบหลายภาษา)
* **ความกลมกลืนทั่วทั้งระบบ**: โค้ด HTML, `code`, `pre`, `kbd`, `samp` ถูกกำหนดให้ใช้แบบอักษร `Kanit` เช่นเดียวกัน เพื่อรักษาภาพลักษณ์ที่เป็นมืออาชีพและเข้าถึงง่ายของระบบราชการ
* **Base Font Size**: ใช้ขนาด 100% (16px) มาตรฐานเบราว์เซอร์ เพื่อให้สัดส่วนการย่อ-ขยายถูกต้องสมบูรณ์

### 4.2 ระบบมิติเงา (Layered Purple Shadows)
การ์ดและกล่องข้อมูลทุกชิ้นในระบบใช้มิติเงาซ้อนพิเศษที่มีการเหลือบเฉดม่วงโปร่งแสงเล็กน้อย (School Purple Tint) แทนสีเทาดำทึบ ทำให้หน้าระบบดูนุ่มนวลและมีระดับ:
```css
:root {
    --shadow-card:
        0 1px 2px rgb(28 21 48 / 0.05),
        0 4px 14px -4px rgb(59 15 112 / 0.1);
    --shadow-card-hover:
        0 2px 4px rgb(28 21 48 / 0.06),
        0 12px 28px -8px rgb(59 15 112 / 0.2);
}

/* นำไปใช้กับการ์ดขอบมนขนาดใหญ่ทั้งหมด */
:is(.rounded-xl, .rounded-2xl, .rounded-3xl).border.bg-card,
[data-slot='card'] {
    box-shadow: var(--shadow-card);
}

/* เอฟเฟกต์ยกตัวเมื่อ Hover สำหรับปุ่มและการ์ดที่คลิกได้ */
a:is(.rounded-xl, .rounded-2xl).border.bg-card:hover,
button:is(.rounded-xl, .rounded-2xl).border.bg-card:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-1px);
}
```
*(รองรับ `prefers-reduced-motion: reduce` โดยปิด transition/transform เมื่อผู้ใช้เปิดการตั้งค่าลดการเคลื่อนไหว)*

---

## 5. คลังคอมโพเนนต์และไลบรารี UI (UI Libraries & Component Primitives)

ระบบใช้ชุดคอมโพเนนต์ที่พัฒนาตามแนวคิด **Headless Primitives + Tailwind Styling** (สไตล์ shadcn/ui) โดยไม่มี CSS สำเร็จรูปที่ผูกมัด ทำให้ปรับแต่งได้อย่างอิสระและมี Accessibility สูง

### 5.1 รายการไลบรารีส่วนหน้า (Frontend Packages)

| ไลบรารี | เวอร์ชัน | วัตถุประสงค์การใช้งาน |
|---|---|---|
| **Radix UI Primitives** | `^1.1.x` - `^2.1.x` | แกนหลักคอมโพเนนต์ที่เข้าถึงได้ (Accessible): Dialog, Dropdown, Select, Tooltip, Avatar, Checkbox, Collapsible, Toggle, Popover ฯลฯ |
| **Lucide React** | `^0.475.0` | ชุดไอคอนแบบ Minimalist เส้นสายคมชัด (ใช้ขนาด 16px - 20px) |
| **Sonner** | `^2.0.0` | ระบบ Toast Notification แจ้งผลการบันทึกข้อมูล/ข้อผิดพลาด สวยงามและไม่บดบังเนื้อหา |
| **Input OTP** | `^1.4.2` | ช่องกรอกรหัสยืนยันตัวตน 2FA แบบแยกช่องกรอก (One-Time Password) |
| **React Markdown + Remark GFM** | `^10.1.0` / `^4.0.1` | เรนเดอร์ข้อความประกาศ, คู่มือการประเมิน, และแบบฟอร์ม Markdown |
| **Class Variance Authority (CVA)** | `^0.7.1` | จัดการ Variant ของคอมโพเนนต์ เช่น ปุ่ม (default, destructive, outline, ghost) |
| **Laravel Passkeys** | `^0.2.0` | การยืนยันตัวตนแบบไม่ใช้รหัสผ่าน (WebAuthn / Passkeys / Fingerprint) |

### 5.2 โครงสร้างคอมโพเนนต์ภายในโปรเจกต์ (`resources/js/components/`)
* **`ui/` (Core Design Primitives)**:
  `button.tsx`, `card.tsx`, `dialog.tsx`, `sheet.tsx`, `badge.tsx`, `select.tsx`, `table.tsx`, `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `avatar.tsx`, `alert.tsx`, `tooltip.tsx`, `skeleton.tsx`, `sonner.tsx`
* **`evaluation/` (ระบบแบบประเมิน)**:
  `stepper.tsx`, `level-picker.tsx`, `evidence-field.tsx`, `evidence-preview.tsx`, `step-general.tsx`, `step-part1.tsx`, `step-part2.tsx`, `step-c2.tsx`, `step-c3.tsx`, `step-summary.tsx`, `export-download.tsx`
* **`org-chart/` (แผนผังโครงสร้างองค์กร)**:
  `org-canvas.tsx`, `org-toolbar.tsx`, `org-node.tsx`, `group-column.tsx`, `department-block.tsx`, `person-sheet.tsx`
* **`teacher/` & `supervisor/`**:
  `teacher-sidebar.tsx`, `teacher-topbar.tsx`, `stat-card.tsx`, `status-charts.tsx`, `status-donut.tsx`, `department-table.tsx`
* **`admin/`**:
  `admin-tools.tsx`, `period-state.tsx`, `confirm-dialog.tsx`, `attachment-uploader.tsx`, `markdown-editor.tsx`

---

## 6. โมดูลหน้าจอพิเศษและเลย์เอาต์ (Specialized Layouts & UI Modules)

### 6.1 ระบบเลย์เอาต์แยกตามบทบาท (Role-based Layouts)
1. **`AdminLayout`**:
   * Sidebar นำทางระบบแอดมิน, สวิตช์เปิด-ปิดรอบการประเมิน, การขยายเวลารายคน
   * แถบสีส้มด้านบนเตือนสถานะเมื่อทำการสวมสิทธิ์ผู้ใช้ (Impersonation Banner)
2. **`TeacherLayout`**:
   * ออกแบบสำหรับทั้งครูและผู้บริหาร (Supervisor)
   * โครงสร้างแบบ Responsive Sidebar: บนหน้าจอคอมพิวเตอร์เป็น Sidebar ด้านซ้าย 280px, บนมือถือพับเก็บเป็น Sheet Drawer
   * แถบหัวเรื่องแสดงปีการศึกษาและสถานะรอบปัจจุบัน
3. **`AuthSimpleLayout`**:
   * หน้า Login ที่สะอาด เรียบง่าย มีตราโรงเรียนพานพิทยาคม ชื่อระบบภาษาไทย และฟอร์มกรอกข้อมูลพร้อมการเข้าสู่ระบบด้วย Passkey

### 6.2 ระบบประเมินผล 6 ขั้นตอน (Evaluation Stepper UX)
* แถบ Stepper ด้านบนแสดงความคืบหน้าแบบ Real-time:
  1. ข้อมูลทั่วไป (วันลา / ภาระการสอน)
  2. องค์ประกอบที่ 1: ด้านการจัดการเรียนรู้และพัฒนา
  3. องค์ประกอบที่ 1 (ต่อ): ภาระงานตามกลุ่มบริหารสถานศึกษา 5 กลุ่มงาน
  4. องค์ประกอบที่ 2: การมีส่วนร่วมในการพัฒนาการศึกษา
  5. องค์ประกอบที่ 3: การปฏิบัติตนในการรักษาวินัย คุณธรรม จริยธรรม
  6. สรุปคะแนนและลงนามรับรองตนเอง
* **Level Picker**: ปุ่มกดเลือกระดับคะแนน 1–4 แบบการ์ดพร้อมคำอธิบายเกณฑ์ชัดเจน
* **Evidence Pill**: แนบลิงก์ Google Drive หรือไฟล์หลักฐาน พร้อมตัวบ่งชี้สถานะ

### 6.3 แผนผังองค์กรแบบ Interactive (`org-chart`)
* **Canvas แบบ Pan & Zoom**: เลื่อนดูสายงานได้อย่างอิสระ พร้อมปุ่ม Reset, Fit-to-screen และ Fullscreen
* **CSS Tree Connectors**: เส้นโยงสายงานที่วาดด้วย Pure CSS (`.org-branch-bar`, `.org-vline`, `.org-stem`) ช่วยให้เรนเดอร์ได้ลื่นไหล ไม่ต้องพึ่งพาไลบรารี Canvas/SVG ภายนอกที่หนัก
* **Search & Highlight**: ค้นหาชื่อครูแล้วโฟกัสพร้อมเน้นกรอบสีทอง (`.org-hit`)

---

## 7. มาตรฐานการพิมพ์เอกสารราชการ (Print Optimization)

ระบบถูกออกแบบมาให้สามารถพิมพ์เอกสารทางราชการ (ทำเนียบบุคลากร, แบบประเมิน, แผนผังองค์กร) ออกมาได้อย่างสมบูรณ์แบบโดยไม่ต้องแคปภาพหน้าจอ:

```css
/* ตัดเงาและการยกตัวของการ์ดออกทั้งหมดเมื่อเข้าสู่โหมดพิมพ์ */
@media print {
    @page {
        size: A4;
        margin: 12mm;
    }
    :is(.rounded-xl, .rounded-2xl, .rounded-3xl).border.bg-card,
    [data-slot='card'] {
        box-shadow: none !important;
    }
}

/* แผนผังองค์กร: พิมพ์บนกระดาษขนาด A3 แนวนอน */
body:has(.org-print-page) {
    page: org-chart;
}
@page org-chart {
    size: A3 landscape;
    margin: 8mm;
}
@media print {
    .org-canvas {
        zoom: 0.62 !important;
        padding: 0;
    }
    .org-print-page {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}
```

---

## 8. กฎเกณฑ์ประสบการณ์ผู้ใช้และการใช้แบรนด์ (UX & Branding Rules)

1. **กติกาการแสดงชื่อระบบ (Strict Branding Rule)**:
   * **ห้าม Hardcode คำว่า "AWES" บนหน้าจอ UI ทั่วไปเด็ดขาด** (AWES เป็นเพียงชื่อรหัสโฟลเดอร์/ฐานข้อมูล)
   * แสดงคำว่า AWES ได้ที่เดียวคือคำบรรยายภาษาอังกฤษใต้หัวหน้า Login: *"Academic Workload Evaluation System (AWES)"*
   * ชื่อที่แสดงต่อผู้ใช้ทุกหน้าคือ **"ระบบประเมินภาระงานครูโรงเรียนพานพิทยาคม"**
   * อ่านค่าจาก Inertia Shared Prop `usePage().props.brand` เสมอ (ห้ามเขียนสตริงชื่อระบบลงในไฟล์ TSX โดยตรง)
2. **การรองรับหลายภาษา (i18n)**:
   * ทุกป้ายข้อความ (Label), ปุ่ม, และคำเตือน ต้องห่อด้วย `t('key')` หรือรองรับการสลับภาษา ไทย, อังกฤษ, จีน
3. **Accessibility & Responsive**:
   * ทุก Interactive element ต้องมี Focus Ring สีม่วง (`focus-visible:ring-2 focus-visible:ring-primary`)
   * รองรับการใช้งานผ่านมือถือ แท็บเล็ต และคอมพิวเตอร์อย่างสมบูรณ์แบบ

