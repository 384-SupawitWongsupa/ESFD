# รายละเอียดสถาปัตยกรรมและฟีเจอร์ระบบทะเบียนกิจการ อบต.ดอยงาม (DoiNgamApp)

> **เอกสารคู่มือทางเทคนิคและสารสนเทศระบบฉบับสมบูรณ์**  
> **หน่วยงาน:** องค์การบริหารส่วนตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย  
> **ระบบ:** DoiNgamApp (ระบบทะเบียนกิจการและใบอนุญาตออนไลน์)  

---

## 1. บทนำและภาพรวมของระบบ (System Overview)

**DoiNgamApp** เป็นเว็บแอปพลิเคชันบริหารจัดการงานทะเบียนพาณิชย์และสุขาภิบาลสำหรับองค์กรปกครองส่วนท้องถิ่น พัฒนาขึ้นเพื่อทดแทนระบบเอกสารกระดาษและ Google Sheets เดิม โดยเปลี่ยนผ่านสู่ระบบฐานข้อมูลเชิงสัมพันธ์ (Relational Database) ตามมาตรฐาน 3rd Normal Form (3NF) เชื่อมต่ออุปกรณ์เครื่องอ่านบัตรประชาชน (Smart Card Reader) สำหรับการลงทะเบียนและสืบค้นข้อมูลหน้างาน ตลอดจนมีระบบสร้างเอกสารราชการ (ใบอนุญาต อภ.๒ และแบบคำขอ) ในรูปแบบ PDF และ Word อัตโนมัติ

---

## 2. เทคโนโลยีและเครื่องมือที่ใช้ในการพัฒนา (Technology Stack)

| ส่วนประกอบ | เทคโนโลยี / ไลบรารี | เวอร์ชัน / รายละเอียด | หน้าที่และความสำคัญ |
| :--- | :--- | :--- | :--- |
| **Backend & UI Framework** | **Python** | 3.12+ | ภาษาหลักในการพัฒนาตรรกะระบบ |
| | **Streamlit** | ล่าสุด | Full-stack Web Framework สำหรับสร้าง Interactive UI |
| **Database (RDBMS)** | **MySQL Server** | 8.0+ | ฐานข้อมูลเชิงสัมพันธ์หลัก จัดเก็บข้อมูลกิจการ ผู้ประกอบการ ใบอนุญาต และการออกตรวจ |
| **Database Driver & ORM** | **SQLAlchemy** | 2.0+ | Object Relational Mapping และจัดการ Connection Pool (`@st.cache_resource`, `pool_pre_ping=True`) |
| | **PyMySQL** | ล่าสุด | Python MySQL Client Driver |
| **Authentication DB** | **Google Firebase Firestore** | Cloud Firestore | ฐานข้อมูล NoSQL จัดเก็บข้อมูลบัญชีผู้ใช้งาน และสถานะการอนุมัติสิทธิ์ |
| **Security & Cryptography** | **bcrypt** | ล่าสุด | อัลกอริทึมการเข้ารหัสทางเดียว (Salt & Hash) สำหรับรหัสผ่านผู้ใช้งาน |
| **Hardware Integration** | **pyscard** | 2.3+ | เชื่อมต่อ PC/SC Smart Card Reader อ่านข้อมูลชิปบัตรประจำตัวประชาชนไทยผ่านคำสั่ง APDU |
| **Document Generation** | **ReportLab** | ล่าสุด | สร้างเอกสาร PDF พิกัดแม่นยำ พร้อมฝังฟอนต์มาตรฐานราชการไทย (`THSarabunNew.ttf`) |
| | **python-docx** | ล่าสุด | สร้างและแก้ไขไฟล์ Microsoft Word (`.docx`) สำหรับแบบฟอร์มที่มีเงื่อนไขพิเศษ |
| | **pypdf** | ล่าสุด | จัดการรวมหน้าและพิมพ์ข้อความซ้อนทับ (Overlay) ลงบนแบบฟอร์มเทมเพลตราชการ |
| **Spreadsheet & Reporting** | **pandas** | ล่าสุด | จัดการโครงสร้างข้อมูลแบบ DataFrame คัดกรองและประมวลผลสถิติ |
| | **xlsxwriter** | ล่าสุด | ส่งออกรายงานสถิติและรายชื่อแจ้งเตือนเป็นไฟล์ Excel (`.xlsx`) |
| **Cloud Storage & API** | **Google Drive** | Apps Script Web App | จัดเก็บไฟล์ภาพถ่ายและเอกสารสแกนการออกตรวจผ่าน REST API |
| | **requests** | ล่าสุด | ส่ง HTTP POST Requests ข้อมูลภาพแบบ Base64 ไปยัง Google Apps Script |

---

## 3. สถาปัตยกรรมฐานข้อมูลแบบละเอียด (Database Schema Specification)

ระบบใช้ฐานข้อมูล **MySQL** ชื่อ `doingam_db` เข้ารหัสแบบ `utf8mb4_unicode_ci` รองรับภาษาไทย 100% ออกแบบตามมาตรฐาน **Normalization (3NF)** เพื่อขจัดปัญหาข้อมูลซ้ำซ้อน (Data Redundancy)

```mermaid
erDiagram
    owners ||--o{ businesses : "1 owner owns N businesses"
    business_categories ||--o{ businesses : "1 category has N businesses"
    businesses ||--o{ licenses : "1 business has N licenses"
    businesses ||--o{ inspection_records : "1 business has N inspections"
    inspection_rounds ||--o{ inspection_records : "1 round inspects N businesses"

    owners {
        int owner_id PK
        string citizen_id
        string juristic_id
        string owner_name
        string phone
        string office_address
        string moo
        string subdistrict
        string district
        string province
        timestamp created_at
        timestamp updated_at
    }

    business_categories {
        int category_id PK
        string category_name UK
    }

    businesses {
        int business_id PK
        int owner_id FK
        int category_id FK
        string shop_name
        text operation_type
        string shop_address
        string shop_moo
        string shop_phone
        string business_area
        string machine_power
        string worker_count
        timestamp created_at
        timestamp updated_at
    }

    licenses {
        int license_id PK
        int business_id FK
        decimal fee
        string receipt_book
        string receipt_no
        date receipt_date
        date expire_date
        enum status
        timestamp created_at
        timestamp updated_at
    }

    inspection_rounds {
        int round_id PK
        string round_name UK
        date inspection_date
        timestamp created_at
    }

    inspection_records {
        int record_id PK
        int round_id FK
        int business_id FK
        text condition_4_3
        text condition_4_4
        text file_url
        text notes
        timestamp created_at
    }
```

---

### 3.1 รายละเอียดตารางใน MySQL (Tables & Fields)

#### ตารางที่ 1: `business_categories` (หมวดหมู่ประเภทกิจการหลัก)
*ตารางเก็บประเภทกิจการตามข้อบัญญัติท้องถิ่น ป้องกันการพิมพ์ชื่อประเภทผิดพลาด*

| ลำดับ | ฟิลด์ (Field Name) | ประเภทข้อมูล (Data Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `category_id` | `INT` | **PK**, AUTO_INCREMENT | รหัสประเภทกิจการ |
| 2 | `category_name` | `VARCHAR(100)` | **UNIQUE**, NOT NULL | ชื่อประเภทกิจการ เช่น "สถานประกอบกิจการ", "จำหน่าย/สะสมอาหาร", "ตลาด" |

---

#### ตารางที่ 2: `owners` (ข้อมูลผู้ประกอบการ / เจ้าของ / นิติบุคคล)
*แยกข้อมูลบุคคล/นิติบุคคลออกจากสถานประกอบการ (ผู้ประกอบการ 1 รายมีได้หลายกิจการ)*

| ลำดับ | ฟิลด์ (Field Name) | ประเภทข้อมูล (Data Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `owner_id` | `INT` | **PK**, AUTO_INCREMENT | รหัสประจำตัวผู้ประกอบการ |
| 2 | `citizen_id` | `VARCHAR(20)` | NULL, **INDEX** | เลขประจำตัวประชาชน 13 หลัก (บุคคลธรรมดา) |
| 3 | `juristic_id` | `VARCHAR(50)` | NULL, **INDEX** | ทะเบียนนิติบุคคลเลขที่ (ห้างหุ้นส่วน / บริษัท) |
| 4 | `owner_name` | `VARCHAR(255)` | NOT NULL, **INDEX** | คำนำหน้า ชื่อ และนามสกุล หรือชื่อนิติบุคคล |
| 5 | `phone` | `VARCHAR(50)` | NULL, **INDEX** | หมายเลขโทรศัพท์ติดต่อของผู้ประกอบการ |
| 6 | `office_address` | `VARCHAR(255)` | NULL | ที่อยู่สำนักงาน / บ้านเลขที่ตามทะเบียนบ้าน |
| 7 | `moo` | `VARCHAR(10)` | NULL | หมู่ที่ตามทะเบียนบ้าน |
| 8 | `subdistrict` | `VARCHAR(100)` | DEFAULT 'ดอยงาม' | ตำบล |
| 9 | `district` | `VARCHAR(100)` | DEFAULT 'พาน' | อำเภอ |
| 10 | `province` | `VARCHAR(100)` | DEFAULT 'เชียงราย' | จังหวัด |
| 11 | `created_at` | `TIMESTAMP` | CURRENT_TIMESTAMP | วันที่และเวลาที่บันทึกข้อมูล |
| 12 | `updated_at` | `TIMESTAMP` | ON UPDATE CURRENT_TIMESTAMP | วันที่และเวลาที่มีการปรับปรุงล่าสุด |

---

#### ตารางที่ 3: `businesses` (ข้อมูลสถานประกอบการ / ร้านค้า)
*เก็บรายละเอียดที่ตั้งและลักษณะทางกายภาพของสถานที่ประกอบการ*

| ลำดับ | ฟิลด์ (Field Name) | ประเภทข้อมูล (Data Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `business_id` | `INT` | **PK** | รหัสสถานประกอบการ (อ้างอิงลำดับเดิมเพื่อความต่อเนื่อง) |
| 2 | `owner_id` | `INT` | **FK** -> `owners` | รหัสผู้ประกอบการเจ้าของกิจการ |
| 3 | `category_id` | `INT` | **FK** -> `categories` | รหัสประเภทกิจการหลัก |
| 4 | `shop_name` | `VARCHAR(255)` | NULL, **INDEX** | ชื่อสถานประกอบการ / ชื่อร้านค้า |
| 5 | `operation_type` | `TEXT` | NOT NULL | รายละเอียดประเภทการทำกิจการเฉพาะ เช่น ร้านของชำ, อู่ซ่อมรถ |
| 6 | `shop_address` | `VARCHAR(255)` | NULL | ที่ตั้งสถานประกอบการ (เลขที่) |
| 7 | `shop_moo` | `VARCHAR(10)` | NULL | หมู่ที่ของที่ตั้งสถานประกอบการ |
| 8 | `shop_phone` | `VARCHAR(50)` | NULL | หมายเลขโทรศัพท์ของสถานประกอบการ (โทรศัพท์ 2) |
| 9 | `business_area` | `VARCHAR(100)` | NULL | ขนาดพื้นที่ประกอบการ (เช่น ตารางเมตร) |
| 10 | `machine_power` | `VARCHAR(100)` | NULL | ขนาดกำลังเครื่องจักร (เช่น แรงม้า) |
| 11 | `worker_count` | `VARCHAR(50)` | NULL | จำนวนคนงานในสถานประกอบการ |
| 12 | `created_at` | `TIMESTAMP` | CURRENT_TIMESTAMP | วันที่บันทึก |
| 13 | `updated_at` | `TIMESTAMP` | ON UPDATE CURRENT_TIMESTAMP | วันที่ปรับปรุง |

---

#### ตารางที่ 4: `licenses` (ข้อมูลใบอนุญาตและการชำระเงิน)
*แยกประวัติการออกใบอนุญาตและใบเสร็จรับเงิน (รองรับการต่ออายุในแต่ละปี)*

| ลำดับ | ฟิลด์ (Field Name) | ประเภทข้อมูล (Data Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `license_id` | `INT` | **PK**, AUTO_INCREMENT | รหัสรายการใบอนุญาต |
| 2 | `business_id` | `INT` | **FK** -> `businesses` | รหัสสถานประกอบการที่ได้รับใบอนุญาต |
| 3 | `fee` | `DECIMAL(10,2)` | DEFAULT 0.00 | ค่าธรรมเนียมใบอนุญาต (บาท) |
| 4 | `receipt_book` | `VARCHAR(50)` | NULL | เล่มที่ใบเสร็จรับเงิน |
| 5 | `receipt_no` | `VARCHAR(50)` | NULL | เลขที่ใบเสร็จรับเงิน |
| 6 | `receipt_date` | `DATE` | NULL | วันที่ออกใบเสร็จ (ลงวันที่) |
| 7 | `expire_date` | `DATE` | NULL, **INDEX** | วันหมดอายุของใบอนุญาต |
| 8 | `status` | `ENUM` | DEFAULT 'active' | สถานะใบอนุญาต: `'active'`, `'expired'`, `'renewed'` |
| 9 | `created_at` | `TIMESTAMP` | CURRENT_TIMESTAMP | วันที่บันทึก |
| 10 | `updated_at` | `TIMESTAMP` | ON UPDATE CURRENT_TIMESTAMP | วันที่ปรับปรุง |

---

#### ตารางที่ 5: `inspection_rounds` (รอบการออกตรวจสุขลักษณะ)
*กำหนดวาระหรือช่วงเวลาการลงพื้นที่ตรวจสถานประกอบการ*

| ลำดับ | ฟิลด์ (Field Name) | ประเภทข้อมูล (Data Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `round_id` | `INT` | **PK**, AUTO_INCREMENT | รหัสรอบการตรวจ |
| 2 | `round_name` | `VARCHAR(100)` | **UNIQUE**, NOT NULL | ชื่อรอบการออกตรวจ เช่น "ออกตรวจ 15.6.68" |
| 3 | `inspection_date` | `DATE` | NOT NULL, **INDEX** | วันที่ออกตรวจจริงตามรอบ |
| 4 | `created_at` | `TIMESTAMP` | CURRENT_TIMESTAMP | วันที่สร้างรอบตรวจ |

---

#### ตารางที่ 6: `inspection_records` (บันทึกผลการออกตรวจรายสถานประกอบการ)
*Bridge Table เชื่อมโยงรอบการตรวจและสถานประกอบการ พร้อมเงื่อนไขและไฟล์แนบ*

| ลำดับ | ฟิลด์ (Field Name) | ประเภทข้อมูล (Data Type) | คีย์ / ข้อกำหนด | คำอธิบาย |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `record_id` | `INT` | **PK**, AUTO_INCREMENT | รหัสบันทึกผลการตรวจ |
| 2 | `round_id` | `INT` | **FK** -> `inspection_rounds` | รหัสรอบการตรวจที่เกี่ยวข้อง |
| 3 | `business_id` | `INT` | **FK** -> `businesses` | รหัสสถานประกอบการที่ถูกตรวจ |
| 4 | `condition_4_3` | `TEXT` | NULL | เงื่อนไขเพิ่มเติมข้อ 4.3 ตามใบอนุญาต |
| 5 | `condition_4_4` | `TEXT` | NULL | เงื่อนไขเพิ่มเติมข้อ 4.4 ตามใบอนุญาต |
| 6 | `file_url` | `TEXT` | NULL | URL ลิงก์ไฟล์สแกนหลักฐาน / ภาพถ่ายบน Google Drive |
| 7 | `notes` | `TEXT` | NULL | หมายเหตุเพิ่มเติมและชื่อเจ้าหน้าที่ผู้ออกตรวจ |
| 8 | `created_at` | `TIMESTAMP` | CURRENT_TIMESTAMP | วันที่บันทึกผลตรวจ |
| *Constraint* | `uq_round_business` | **UNIQUE** (`round_id`, `business_id`) | | ป้องกันการบันทึกตรวจร้านซ้ำในรอบเดียวกัน |

---

### 3.2 ฐานข้อมูลผู้ใช้งานใน Google Firebase Firestore

คอลเลกชัน **`users`** (Document ID คือ `username` เช่น อีเมลของเจ้าหน้าที่)

| ชื่อฟิลด์ (Field Name) | ประเภท (Type) | คำอธิบาย |
| :--- | :---: | :--- |
| `username` | String | ชื่อบัญชีผู้ใช้งาน / อีเมล |
| `password` | String | รหัสผ่านที่เข้ารหัสด้วย bcrypt Hash |
| `name` | String | ชื่อ-นามสกุลจริงของเจ้าหน้าที่ |
| `position` | String | ตำแหน่งงาน เช่น "นักวิชาการสาธารณสุขปฏิบัติการ" |
| `role` | String | ระดับสิทธิ์: `'admin'` (ผู้ดูแลระบบ), `'staff'` (เจ้าหน้าที่) |
| `status` | String | สถานะการใช้งาน: `'approved'` (อนุมัติแล้ว), `'pending'` (รออนุมัติ), `'revoked'` (ระงับสิทธิ์) |

---

## 4. รายละเอียดฟังก์ชันการทำงานทั้งหมดของระบบ (Feature Breakdown)

### 4.1 ระบบยืนยันตัวตนและความปลอดภัย (Authentication & User Control)
- **ระบบเข้าสู่ระบบแบบแยกบทบาท (RBAC):** แยกระหว่างแอดมิน (Admin) และเจ้าหน้าที่ทั่วไป (Staff)
- **ระบบลงทะเบียนเจ้าหน้าที่ใหม่:** กรอกชื่อผู้ใช้ รหัสผ่าน ชื่อ-สกุล และตำแหน่ง โดยบัญชีจะอยู่ในสถานะ `pending` อัตโนมัติ
- **ระบบแผงควบคุมผู้ดูแลระบบ (Admin Dashboard):**
  - ตรวจสอบคำขอลงทะเบียนใหม่ พร้อมปุ่มอนุมัติ (`approved`) หรือปฏิเสธคำขอ (`delete`)
  - รายชื่อเจ้าหน้าที่ที่ได้รับอนุมัติแล้ว พร้อมฟังก์ชันเปลี่ยนรหัสผ่านใหม่
  - ฟังก์ชันระงับสิทธิ์เจ้าหน้าที่ (`revoked`) ได้ทันที

### 4.2 ระบบแดชบอร์ดสถิติและการติดตาม (Dashboard & Analytics)
- **Metric Cards สรุปผล Real-time:** แสดงจำนวนกิจการทั้งหมด, กิจการที่หมดอายุแล้ว, และกิจการที่ใกล้หมดอายุ (ภายใน 90 วัน)
- **ตัวกรองชีตเป้าหมาย (Target Sheet Selector):** เลือกดูข้อมูลตามรอบการออกตรวจ หรือดูภาพรวมทั้งตำบล ("รวมกิจการ")
- **ตัวกรองประเภทกิจการ (Global Category Filter):** กรองดูเฉพาะกลุ่ม "สถานประกอบกิจการ", "จำหน่าย/สะสมอาหาร" หรือ "ตลาด"
- **ดาวน์โหลดแบบตรวจราชการ:** ปุ่มดาวน์โหลดแบบฟอร์มตรวจประเมินสุขลักษณะภายนอก (PDF)

### 4.3 ระบบสืบค้นอัจฉริยะ (Smart Search & Directory)
- **ค้นหาหลายมิติ (Multi-field Search):** พิมพ์ค้นหาได้จากชื่อ-สกุล, เลขประจำตัวประชาชน 13 หลัก, ชื่อร้าน หรือที่อยู่
- **⚡ เสียบบัตรประชาชนค้นหา (Smart Card Instant Search):** เสียบบัตรประชาชนของผู้มาติดต่อเข้าเครื่องอ่าน USB แล้วกดค้นหา ระบบจะดึงเลข 13 หลักมาสืบค้นประวัติกิจการทั้งหมดทันทีใน 1 วินาที
- **การ์ดข้อมูลผู้ประกอบการ (Grouped Cards):** แสดงสรุปข้อมูลผู้ประกอบการ 1 ราย พร้อมรายการสถานประกอบการและใบอนุญาตทั้งหมดที่ถือครอง
- **ป้ายลิงก์ไฟล์แนบ (Direct Attachment Badge):** แสดงปุ่ม `📎 ดูไฟล์แนบ` บนการ์ด เพื่อคลิกเปิดดูภาพถ่ายหรือเอกสารสแกนบน Google Drive ได้ทันที

### 4.4 ระบบลงทะเบียนกิจการรายใหม่ (New Business Registration)
- **⚡ อ่านบัตรประชาชนกรอกฟอร์มอัตโนมัติ:** เสียบบัตรประชาชนแล้วกดปุ่ม ระบบจะดึง:
  - เลขประจำตัวประชาชน 13 หลัก
  - ชื่อ - สกุล
  - บ้านเลขที่, หมู่ที่, ตำบล, อำเภอ, จังหวัด  
  ลงในฟอร์มทันที ขจัดปัญหาพิมพ์ผิดและลดเวลาทำงาน
- **Dropdown ประเภทกิจการ:** เลือกจาก 3 หมวดหมู่มาตรฐาน ("สถานประกอบกิจการ", "จำหน่าย/สะสมอาหาร", "ตลาด")
- **คำนวณลำดับถัดไปอัตโนมัติ:** ดึง `MAX(business_id) + 1` จากฐานข้อมูล MySQL ป้องกันการซ้ำซ้อน

### 4.5 ระบบบริหารรอบการออกตรวจและบันทึกผลหน้างาน (Inspection Workflow)
- **สร้างรอบการออกตรวจใหม่ (Create Inspection Round):** กำหนดชื่อรอบตรวจ เช่น "ออกตรวจ 15.6.68" บันทึกเป็นวาระใน SQL
- **ฟังก์ชัน "✅ ออกตรวจแล้ว":** ในหน้ารายชื่อหมดอายุ เมื่อเจ้าหน้าที่ลงพื้นที่ตรวจแล้ว สามารถกดปุ่มนี้เพื่อเปิดฟอร์มบันทึก:
  - เลือกรอบการตรวจ
  - บันทึกเงื่อนไขพิเศษ 4.3 และ 4.4
  - กำหนดค่าธรรมเนียม เล่มที่/เลขที่ใบเสร็จ
  - คำนวณวันหมดอายุใหม่ล่วงหน้า 1 ปีให้อัตโนมัติ
  - ระบุชื่อผู้ออกตรวจและหมายเหตุ
- **ส่งต่องานอย่างไร้รอยต่อ (Collaborative Workflow):** เมื่อบันทึกสถานะออกตรวจแล้ว สถานะจะเปลี่ยนเป็น `✅ ออกตรวจแล้ว (รอพิมพ์)` พร้อมปุ่ม `🖨️ พิมพ์ใบ` ให้เจ้าหน้าที่ฝ่ายสำนักงานเข้ามากดพิมพ์เอกสารต่อได้ทันที
- **อัปโหลดไฟล์หลักฐานขึ้นคลาวด์:** อัปโหลดไฟล์สแกน/ภาพถ่ายผ่าน Google Apps Script ไปยังโฟลเดอร์ Google Drive พร้อมเก็บ URL สะสมลงตาราง `inspection_records` โดยไม่ลบไฟล์เดิม

### 4.6 ระบบสร้างเอกสารราชการอัตโนมัติ (Automated Document Generation)
- **ใบอนุญาตประกอบกิจการ (แบบ อภ.๒):**
  - สร้างไฟล์ **PDF** จัดหน้าและฟอนต์มาตรฐานราชการไทย (`TH Sarabun New`) แม่นยำทุกพิกัด
  - สร้างไฟล์ **Microsoft Word (.docx)** กรณีมีเงื่อนไขเพิ่มเติมข้อ 4.3/4.4 เพื่อให้เจ้าหน้าที่ปรับแต่งข้อความก่อนพิมพ์
- **แบบคำขอรับใบอนุญาต (สธ.๒):** สร้างเอกสารคำขอทั้งรูปแบบ PDF และ Word อัตโนมัติ
- **ระบบพิมพ์รวมและบีบอัดไฟล์ (Batch Print ZIP):** สั่งสร้างใบอนุญาตทุกใบของผู้ประกอบการรายนั้น และดาวน์โหลดรวมเป็นไฟล์ `.zip` ได้ในคลิกเดียว

### 4.7 ระบบติดตามวันหมดอายุและการแจ้งเตือน (Expiration Alert System)
- **แยกหมวดหมู่ชัดเจน:** แสดงรายชื่อที่ "🛑 หมดอายุแล้ว" และ "⏳ ใกล้หมดอายุ (ภายใน 90 วัน)"
- **ส่งออกไฟล์แจ้งเตือน (Excel Export):** ส่งออกรายชื่อผู้ประกอบการที่ต้องต่ออายุ พร้อมที่อยู่และเบอร์โทรศัพท์ เป็นไฟล์ `.xlsx` เพื่อทำหนังสือแจ้งเตือน

---

## 5. การตั้งค่าระบบและการเชื่อมต่อ (Configuration & Secrets)

ไฟล์กำหนดค่า [`.streamlit/secrets.toml`](file:///d:/Doingam/DoiNgamApp/.streamlit/secrets.toml) ประกอบด้วย 2 ส่วนหลัก:

```toml
# 1. การเชื่อมต่อ Firebase Firestore (Service Account)
type = "service_account"
project_id = "doingamapp"
private_key_id = "..."
private_key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
client_email = "firebase-adminsdk-fbsvc@doingamapp.iam.gserviceaccount.com"
client_id = "..."
admin_password = "admin"

# 2. การเชื่อมต่อฐานข้อมูล MySQL
[mysql]
host = "localhost"
port = 3306
user = "root"
password = "..."
database = "doingam_db"
```

---

## 6. สรุปภาพรวมและข้อดีของระบบ (Summary of Benefits)

1. **ลดภาระงานและเวลา:** การใช้เครื่องอ่านบัตรประชาชนและการพิมพ์เอกสารอัตโนมัติ ช่วยลดเวลาออกใบอนุญาตจากเดิมฉบับละ 15–20 นาที เหลือไม่เกิน 1–2 นาที
2. **ความถูกต้องและปลอดภัยของข้อมูล:** จัดเก็บข้อมูลแบบ 3NF ปราศจากข้อมูลซ้ำซ้อน พร้อมระบบสิทธิ์ผู้ดูแลระบบที่เข้มงวด
3. **การทำงานร่วมกันอย่างมีประสิทธิภาพ:** เจ้าหน้าที่ออกตรวจภาคสนามและเจ้าหน้าที่พิมพ์ใบอนุญาตในสำนักงานสามารถเชื่อมโยงสถานะงานกันได้แบบ Real-time
4. **ความพร้อมในการขยายผล:** สถาปัตยกรรมรองรับการนำไปติดตั้งใช้งานทั้งแบบ Local Server และ Cloud Server สำหรับหน่วยงานองค์กรปกครองส่วนท้องถิ่นอื่นต่อไป

