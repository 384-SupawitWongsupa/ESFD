<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <title>ใบอนุญาต อภ.๒ - {{ $business->shop_name }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Sarabun', 'Garuda', 'TH Sarabun New', sans-serif;
            font-size: 15pt;
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
            font-size: 19pt;
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 2px;
        }
        .subtitle {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .receipt-info {
            margin-bottom: 15px;
            font-size: 14pt;
        }
        .content {
            text-align: justify;
            text-justify: inter-cluster;
            line-height: 1.8;
        }
        .indent {
            display: inline-block;
            width: 40px;
        }
        .bold {
            font-weight: bold;
        }
        .condition-box {
            margin-top: 15px;
            padding: 10px 15px;
            border: 1px dashed #666;
            background-color: #fafafa;
        }
        .footer-sign {
            margin-top: 40px;
            float: right;
            text-align: center;
            width: 280px;
        }
        .clear {
            clear: both;
        }
        .dotted-line {
            border-bottom: 1px dotted #333;
            display: inline-block;
            padding: 0 5px;
        }
    </style>
</head>
<body>
    <div class="header-top">แบบ อภ. ๒</div>
    
    <div class="title">ใบอนุญาต</div>
    <div class="subtitle">ประกอบกิจการที่เป็นอันตรายต่อสุขภาพ<br>ตามข้อบัญญัติองค์การบริหารส่วนตำบลดอยงาม</div>

    <table style="width: 100%; margin-bottom: 15px; font-size: 14pt;">
        <tr>
            <td style="width: 50%;">เล่มที่ <span class="bold">{{ $license->receipt_book ?? '-' }}</span></td>
            <td style="width: 50%; text-align: right;">เลขที่ <span class="bold">{{ $license->receipt_no ?? '-' }}</span></td>
        </tr>
    </table>

    <div class="content">
        <span class="indent"></span>เจ้าพนักงานท้องถิ่นผู้ออกใบอนุญาต ได้อนุญาตให้ <span class="bold dotted-line">{{ $owner->owner_name }}</span>
        เลขประจำตัวประชาชน <span class="bold dotted-line">{{ $owner->citizen_id ?? $owner->juristic_id ?? '-' }}</span>
        อยู่บ้านเลขที่ <span class="dotted-line">{{ $owner->office_address ?? '-' }}</span> 
        หมู่ที่ <span class="dotted-line">{{ $owner->moo ?? '-' }}</span>
        ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย โทรศัพท์ {{ $owner->phone ?? '-' }}
        <br><br>
        <span class="indent"></span>ประกอบกิจการ <span class="bold dotted-line">{{ $business->category->category_name ?? '-' }}</span>
        ประเภท <span class="bold dotted-line">{{ $business->operation_type }}</span>
        ชื่อสถานประกอบการ <span class="bold dotted-line">{{ $business->shop_name ?: 'ไม่มีชื่อทางการค้า' }}</span>
        ตั้งอยู่เลขที่ <span class="dotted-line">{{ $business->shop_address ?? '-' }}</span>
        หมู่ที่ <span class="dotted-line">{{ $business->shop_moo ?? '-' }}</span>
        ตำบลดอยงาม อำเภอพาน จังหวัดเชียงราย
        ขนาดพื้นที่ประกอบการ {{ $business->business_area ?? '-' }} 
        กำลังเครื่องจักร {{ $business->machine_power ?? '-' }} 
        คนงาน {{ $business->worker_count ?? '-' }}
    </div>

    <div class="condition-box">
        <div class="bold" style="text-decoration: underline; margin-bottom: 5px;">เงื่อนไขเฉพาะการอนุญาต:</div>
        <div><strong>ข้อ ๔.๓:</strong> {{ $inspection->condition_4_3 ?? 'ปฏิบัติตามมาตรฐานสุขอนามัยและระเบียบกระทรวงสาธารณสุขโดยเคร่งครัด' }}</div>
        <div><strong>ข้อ ๔.๔:</strong> {{ $inspection->condition_4_4 ?? 'ดูแลรักษาความสะอาด ความปลอดภัย และไม่สร้างความเดือดร้อนรำคาญแก่ชุมชน' }}</div>
    </div>

    <div style="margin-top: 15px; font-size: 14pt;">
        ใบอนุญาตนี้สิ้นอายุในวันที่ <span class="bold dotted-line">{{ $expireDate }}</span><br>
        ค่าธรรมเนียม <span class="bold">{{ number_format($license->fee ?? 0, 2) }}</span> บาท
    </div>

    <div style="margin-top: 15px; font-size: 14pt;">
        ออกให้ ณ วันที่ {{ $issueDate }}
    </div>

    <div class="footer-sign">
        (ลงชื่อ)........................................................................<br>
        (........................................................................)<br>
        นายกองค์การบริหารส่วนตำบลดอยงาม<br>
        เจ้าพนักงานท้องถิ่น
    </div>
    <div class="clear"></div>
</body>
</html>

