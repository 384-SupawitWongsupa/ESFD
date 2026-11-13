import os
import sys
import json
import io
import pypdf
from reportlab.pdfgen import canvas
from reportlab.pdfbase import ttfonts, pdfmetrics

# Convert arabic digits to thai digits
def to_thai_digits(text):
    if not text and text != 0:
        return ''
    thai_digits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
    return ''.join(thai_digits[int(c)] if c.isdigit() else c for c in str(text))

def generate_pdf(template_path, output_path, data):
    font_name = 'THSarabun'
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    sarabun_path = os.path.join(base_dir, 'storage', 'app', 'templates', 'THSarabunNew.ttf')

    try:
        if os.path.exists(sarabun_path):
            pdfmetrics.registerFont(ttfonts.TTFont('THSarabun', sarabun_path))
            font_name = 'THSarabun'
        else:
            pdfmetrics.registerFont(ttfonts.TTFont('THSarabun', r'C:\Windows\Fonts\leelawad.ttf'))
            font_name = 'THSarabun'
    except Exception:
        try:
            pdfmetrics.registerFont(ttfonts.TTFont('THSarabun', r'C:\Windows\Fonts\leelawad.ttf'))
            font_name = 'THSarabun'
        except Exception:
            font_name = 'Helvetica'

    # Read base template (page 0)
    reader = pypdf.PdfReader(template_path)
    base_page = reader.pages[0]
    width = float(base_page.mediabox.width)
    height = float(base_page.mediabox.height)

    # Create overlay canvas in memory
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(width, height))
    can.setFont(font_name, 14 if font_name == 'THSarabun' else 10.5)

    # คำขอเลขที่ (ถ้ามี)
    request_no = data.get('request_no') or ''
    if request_no:
        can.drawString(140, 722.4, to_thai_digits(request_no))

    # 1. ประกอบกิจการ
    operation = data.get('business_operation') or ''
    if operation:
        can.drawString(260, 654.2, operation)

    # 2. เขียนที่
    written_at = data.get('written_at') or 'อบต.ดอยงาม'
    can.drawString(360, 626.6, written_at)

    # 3. วันที่ เดือน พ.ศ.
    can.drawString(355, 598.9, to_thai_digits(data.get('date_day') or ''))
    can.drawString(415, 598.9, str(data.get('date_month') or ''))
    can.drawString(505, 598.9, to_thai_digits(data.get('date_year') or ''))

    # 4. ข้าพเจ้า
    applicant = data.get('applicant_name') or ''
    can.drawString(150, 571.3, applicant)

    # 4.1 อายุ (ถ้ามี)
    age = data.get('age') or ''
    if age:
        can.drawString(355, 571.3, to_thai_digits(age))

    # 5. สัญชาติ
    nationality = data.get('nationality') or 'ไทย'
    can.drawString(430, 571.3, nationality)

    # นิติบุคคล
    is_juristic = data.get('is_juristic', False)
    if is_juristic and applicant:
        can.drawString(100, 543.4, applicant)

    # 6. ที่อยู่
    can.drawString(205, 515.9, to_thai_digits(data.get('address_no') or ''))
    can.drawString(275, 515.9, to_thai_digits(data.get('address_moo') or ''))
    can.drawString(350, 515.9, to_thai_digits(data.get('address_soi') or '-'))
    can.drawString(430, 515.9, to_thai_digits(data.get('address_road') or '-'))
    can.drawString(130, 488.3, str(data.get('address_subdistrict') or 'ดอยงาม'))
    can.drawString(280, 488.3, str(data.get('address_district') or 'พาน'))
    can.drawString(360, 488.3, str(data.get('address_province') or 'เชียงราย'))

    # 7. หมายเลขโทรศัพท์
    can.drawString(150, 460.6, to_thai_digits(data.get('phone') or ''))

    # 8. เครื่องหมาย / ในรายการเอกสารแนบ
    if is_juristic:
        can.drawString(112, 294.7, '/')
    else:
        can.drawString(112, 405.0, '/')

    # 9. ลายเซ็นชื่อผู้ขออนุญาตในวงเล็บท้ายเอกสาร
    if applicant:
        can.drawString(255, 98.9, f"({applicant})")

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
