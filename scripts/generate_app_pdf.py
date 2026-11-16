import os
import sys
import json
import io
import pypdf
from reportlab.pdfgen import canvas
from reportlab.pdfbase import ttfonts, pdfmetrics

# แปลงตัวเลขอารบิกเป็นเลขไทย
def to_thai_digits(text):
    if text is None or text == '':
        return ''
    thai_digits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
    return ''.join(thai_digits[int(c)] if c.isdigit() else c for c in str(text))

def get_best_thai_font():
    """
    ลงทะเบียนฟอนต์ราชการ TH Sarabun New แท้
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    sarabun_path = os.path.join(base_dir, 'storage', 'app', 'templates', 'THSarabunNew.ttf')

    if os.path.exists(sarabun_path):
        try:
            pdfmetrics.registerFont(ttfonts.TTFont('THSarabunNew', sarabun_path))
            return 'THSarabunNew'
        except Exception as e:
            print(f"Warning: Failed to load {sarabun_path}: {e}")

    # Fallback to Windows fonts if needed
    for path in [r'C:\Windows\Fonts\leelawad.ttf', r'C:\Windows\Fonts\tahoma.ttf']:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(ttfonts.TTFont('THSarabunNew', path))
                return 'THSarabunNew'
            except Exception:
                continue

    return 'Helvetica'

def generate_pdf(template_path, output_path, data):
    font_name = get_best_thai_font()

    # Read base template (page 0)
    reader = pypdf.PdfReader(template_path)
    base_page = reader.pages[0]
    width = float(base_page.mediabox.width)
    height = float(base_page.mediabox.height)

    # Create overlay canvas in memory
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(width, height))
    
    # กำหนดขนาดตัวอักษร 10.0 pt ให้เท่ากับขนาดข้อความจริงในเอกสารแบบฟอร์ม
    font_size = 10.0
    can.setFont(font_name, font_size)

    # คำขอเลขที่ (ถ้ามี)
    request_no = data.get('request_no') or ''
    if request_no:
        can.drawString(140.0, 722.4, to_thai_digits(request_no))

    # 1. ประกอบกิจการ
    operation = data.get('business_operation') or ''
    if operation:
        can.drawString(260.0, 654.2, str(operation))

    # 2. เขียนที่
    written_at = data.get('written_at') or 'อบต.ดอยงาม'
    can.drawString(360.0, 626.6, str(written_at))

    # 3. วันที่ เดือน พ.ศ.
    can.drawString(355.0, 598.9, to_thai_digits(data.get('date_day') or ''))
    can.drawString(415.0, 598.9, str(data.get('date_month') or ''))
    can.drawString(505.0, 598.9, to_thai_digits(data.get('date_year') or ''))

    # 4. ข้าพเจ้า
    applicant = data.get('applicant_name') or ''
    can.drawString(150.0, 571.3, str(applicant))

    # 4.1 อายุ (ถ้ามี)
    age = data.get('age') or ''
    if age:
        can.drawString(355.0, 571.3, to_thai_digits(age))

    # 5. สัญชาติ
    nationality = data.get('nationality') or 'ไทย'
    can.drawString(430.0, 571.3, str(nationality))

    # นิติบุคคล / ผู้มีอำนาจลงนาม
    juristic_rep = data.get('juristic_rep') or ''
    if juristic_rep:
        can.drawString(100.0, 541.4, str(juristic_rep))
    elif data.get('is_juristic') and applicant:
        can.drawString(100.0, 541.4, str(applicant))

    # 6. ที่อยู่
    can.drawString(205.0, 515.9, to_thai_digits(data.get('address_no') or ''))
    can.drawString(275.0, 515.9, to_thai_digits(data.get('address_moo') or ''))
    can.drawString(350.0, 515.9, to_thai_digits(data.get('address_soi') or '-'))
    can.drawString(430.0, 515.9, to_thai_digits(data.get('address_road') or '-'))
    can.drawString(130.0, 488.3, str(data.get('address_subdistrict') or 'ดอยงาม'))
    can.drawString(280.0, 488.3, str(data.get('address_district') or 'พาน'))
    can.drawString(360.0, 488.3, str(data.get('address_province') or 'เชียงราย'))

    # 7. หมายเลขโทรศัพท์
    can.drawString(150.0, 460.6, to_thai_digits(data.get('phone') or ''))

    # 8. เครื่องหมาย / ในรายการเอกสารแนบ (ข้อ ๒) แต่ละข้อสามารถเลือกติ๊กถูกเองได้
    # พิกัดตรงกลางช่อง [  ] พอดีเป๊ะ
    chk_positions = {
        'chk_1': (112.0, 403.0), # สำเนาบัตรประจำตัวประชาชน
        'chk_2': (112.0, 375.4), # สำเนาใบอนุญาตตามกฎหมาย
        'chk_3': (112.0, 347.8), # หนังสือ EIA
        'chk_4': (112.0, 320.1), # ใบมอบอำนาจ
        'chk_5': (112.0, 294.7), # สำเนาหนังสือรับรองการจดทะเบียนเป็นนิติบุคคล
        'chk_6': (112.0, 264.8), # หลักฐานอำนาจลงนามแทนนิติบุคคล
        'chk_7': (112.0, 237.2), # เอกสารและหลักฐานอื่นๆ
    }

    has_explicit_chk = any(k in data for k in chk_positions)
    if has_explicit_chk:
        for k, (cx, cy) in chk_positions.items():
            val = data.get(k)
            if val is True or val == '1' or val == 1 or val == 'true':
                can.drawString(cx, cy, '/')
    else:
        # Default fallback
        if data.get('is_juristic'):
            can.drawString(112.0, 294.7, '/')
        else:
            can.drawString(112.0, 403.0, '/')

    # 9. ลายเซ็นชื่อผู้ขออนุญาตในวงเล็บท้ายเอกสาร
    if applicant:
        can.drawString(255.0, 98.9, f"({applicant})")

    can.save()
    packet.seek(0)

    # Use PdfWriter with clone_from
    writer = pypdf.PdfWriter(clone_from=template_path)
    while len(writer.pages) > 1:
        writer.remove_page(len(writer.pages) - 1)

    overlay_reader = pypdf.PdfReader(packet)
    writer.pages[0].merge_page(overlay_reader.pages[0])

    with open(output_path, 'wb') as f_out:
        writer.write(f_out)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8-sig') as f:
            cfg = json.load(f)
        generate_pdf(cfg['template_path'], cfg['output_path'], cfg['data'])
        print('SUCCESS')
