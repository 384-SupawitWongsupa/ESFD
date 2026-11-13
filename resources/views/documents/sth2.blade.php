<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <title>แบบคำขอ สธ.๒ - {{ $business->shop_name }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Sarabun', 'Garuda', 'TH Sarabun New', sans-serif;
            font-size: 14pt;
            line-height: 1.6;
            color: #000;
        }
        .header-top {
            text-align: right;
            font-size: 13pt;
            font-weight: bold;
        }
        .title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
        }
        .subtitle {
            text-align: center;
            font-size: 15pt;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            text-align: justify;
            line-height: 1.8;
        }
        .indent {
            display: inline-block;
            width: 40px;
        }
        .bold {
            font-weight: bold;
        }
        .footer-sign {
            margin-top: 40px;
            float: right;
            text-align: center;
            width: 300px;
        }
        .clear {
            clear: both;
        }
    </style>
</head>
<body>
    <div class="header-top">แบบ สธ. ๒</div>
    
    <div class="title">คำขอรับใบอนุญาตจัดตั้งสถานที่ประกอบกิจการ</div>
    <div class="subtitle">เขียนที่ องค์การบริหารส่วนตำบลดอยงาม<br>วันที่ {{ $requestDate }}</div>

    <div class="content">
        <span class="indent"></span>ข้าพเจ้า <span class="bold">{{ $owner->owner_name }}</span>
        เลขประจำตัวประชาชน <span class="bold">{{ $owner->citizen_id ?? $owner->juristic_id ?? '-' }}</span>
        อยู่บ้านเลขที่ {{ $owner->office_address ?? '-' }} หมู่ที่ {{ $owner->moo ?? '-' }} 
        ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย โทรศัพท์ {{ $owner->phone ?? '-' }}
        <br><br>
        <span class="indent"></span>ขอยื่นคำขอรับใบอนุญาตประกอบกิจการต่อเจ้าพนักงานท้องถิ่น องค์การบริหารส่วนตำบลดอยงาม ดังนี้:
        <br>
        ๑. ขอรับใบอนุญาตประเภท <strong>{{ $business->category->category_name ?? '-' }}</strong><br>
        ๒. การดำเนินกิจการ <strong>{{ $business->operation_type }}</strong><br>
        ๓. ชื่อสถานประกอบการ <strong>{{ $business->shop_name ?: 'ไม่มีชื่อทางการค้า' }}</strong><br>
        ๔. ตั้งอยู่เลขที่ {{ $business->shop_address ?? '-' }} หมู่ที่ {{ $business->shop_moo ?? '-' }} ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย<br>
        ๕. พื้นที่ประกอบการ {{ $business->business_area ?? '-' }} กำลังเครื่องจักร {{ $business->machine_power ?? '-' }} คนงาน {{ $business->worker_count ?? '-' }} คน
        <br><br>
        <span class="indent"></span>ข้าพเจ้าขอรับรองว่าข้อความดังกล่าวข้างต้นเป็นความจริงทุกประการ และพร้อมให้เจ้าพนักงานเข้าตรวจสถานที่ตามระเบียบ
    </div>

    <div class="footer-sign">
        (ลงชื่อ)........................................................................ ผู้ขอรับใบอนุญาต<br>
        ( {{ $owner->owner_name }} )
    </div>
    <div class="clear"></div>
</body>
</html>

