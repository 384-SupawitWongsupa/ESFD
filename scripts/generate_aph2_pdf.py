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

# แปลงจำนวนเงินเป็นตัวหนังสือภาษาไทย (Baht text)
def baht_text(number):
    try:
        n = float(number)
    except (ValueError, TypeError):
        return '-'
    if n == 0:
        return 'ศูนย์บาทถ้วน'
    
    units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
    digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    
    int_part = int(n)
    s = str(int_part)
    res = []
    l = len(s)
    
    for i, c in enumerate(s):
        d = int(c)
        pos = l - i - 1
        if d != 0:
            if pos % 6 == 1 and d == 1:
                res.append('สิบ')
            elif pos % 6 == 1 and d == 2:
                res.append('ยี่สิบ')
            elif pos % 6 == 0 and d == 1 and l > 1 and i > 0 and s[i-1] != '0':
                res.append('เอ็ด')
            else:
                res.append(digits[d] + units[pos % 6])
        if pos % 6 == 0 and pos > 0:
            res.append('ล้าน')
            
    return ''.join(res) + 'บาทถ้วน'

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

def generate_aph2_pdf(output_path, data):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    templates_dir = os.path.join(base_dir, 'storage', 'app', 'templates')

    cond_3 = (data.get('condition_4_3') or '').strip()
    cond_4 = (data.get('condition_4_4') or '').strip()

    # ตรวจสอบว่ามีเงื่อนไขจริงหรือไม่ (ไม่นับ 'ไม่มี', '-', '')
    has_cond_3 = bool(cond_3 and cond_3 not in ['ไม่มี', '-', 'ไม่มีเงื่อนไข'])
    has_cond_4 = bool(cond_4 and cond_4 not in ['ไม่มี', '-', 'ไม่มีเงื่อนไข'])

    # หากมีเงื่อนไขเดียว ไม่ว่าระบุที่ข้อ 3 หรือ 4 ให้นำมาเป็นข้อแรก
    if has_cond_4 and not has_cond_3:
        cond_3 = cond_4
        cond_4 = ''
        has_cond_3 = True
        has_cond_4 = False

    # เลือก Template ตามเงื่อนไขที่กำหนด:
    # 1. ไม่มีเงื่อนไข -> template.pdf (aph2_template_base.pdf)
    # 2. มี 1 ข้อ -> template4.3.pdf (aph2_template_4_3.pdf)
    # 3. มี 2 ข้อ -> template4.4.pdf (aph2_template_4_4.pdf)
    if has_cond_3 and has_cond_4:
        template_name = 'aph2_template_4_4.pdf'
        issue_y = 218.8
        expire_y = 194.1
    elif has_cond_3:
        template_name = 'aph2_template_4_3.pdf'
        issue_y = 237.7
        expire_y = 212.8
    else:
        template_name = 'aph2_template_base.pdf'
        issue_y = 237.7
        expire_y = 212.8

    template_path = os.path.join(templates_dir, template_name)
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_path}")

    font_name = get_best_thai_font()

    reader = pypdf.PdfReader(template_path)
    base_page = reader.pages[0]
    width = float(base_page.mediabox.width)
    height = float(base_page.mediabox.height)

    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(width, height))
    font_size = 10.0
    can.setFont(font_name, font_size)

    # 1. เล่มที่, เลขที่, ปี
    # ข้อกำหนด: เล่มที่ ให้เว้นว่างไว้เพื่อให้เจ้าหน้าที่กรอกแทนได้
    book = str(data.get('receipt_book') or '').strip()
    no = str(data.get('receipt_no') or '').strip()
    year = str(data.get('license_year') or '').strip()
    if book and book not in ['-', 'None', 'ว่าง']:
        can.drawString(90.0, 636.5, to_thai_digits(book))
    if no and no not in ['-', 'None']:
        can.drawString(145.0, 636.5, to_thai_digits(no))
    if year and year not in ['-', 'None']:
        can.drawString(200.0, 636.5, to_thai_digits(year))

    # 2. อนุญาตให้ (owner_name) & สัญชาติ
    owner_name = data.get('owner_name') or ''
    nationality = data.get('nationality') or 'ไทย'
    if owner_name and owner_name != '-':
        can.drawString(285.0, 611.7, str(owner_name))
    if nationality and nationality != '-':
        can.drawString(505.0, 611.7, str(nationality))

    # 3. ที่อยู่ผู้ประกอบการ (เลขที่, หมู่, ตำบล, อำเภอ, จังหวัด)
    if data.get('office_address') and data.get('office_address') != '-':
        can.drawString(120.0, 593.0, to_thai_digits(data.get('office_address')))
    if data.get('moo') and data.get('moo') != '-':
        can.drawString(200.0, 593.0, to_thai_digits(data.get('moo')))
    if data.get('subdistrict'):
        can.drawString(265.0, 593.0, str(data.get('subdistrict')))
    if data.get('district'):
        can.drawString(373.0, 593.0, str(data.get('district')))
    if data.get('province'):
        can.drawString(468.0, 593.0, str(data.get('province')))

    # 4. ทะเบียนนิติบุคคล / บัตรประชาชน & โทรศัพท์
    citizen_or_juristic = data.get('id_card_or_juristic') or ''
    phone = data.get('phone') or ''
    if citizen_or_juristic and citizen_or_juristic != '-':
        can.drawString(175.0, 574.3, to_thai_digits(citizen_or_juristic))
    if phone and phone != '-':
        can.drawString(370.0, 574.3, to_thai_digits(phone))

    # 5. ชื่อสถานประกอบการ
    shop_name = data.get('shop_name') or ''
    if shop_name:
        can.drawString(230.0, 549.5, str(shop_name))

    # 6. ประเภทกิจการ
    op_type = data.get('operation_type') or ''
    if op_type and op_type != '-':
        can.drawString(100.0, 530.7, str(op_type))

    # 7. ที่ตั้งสถานประกอบการ (เลขที่, หมู่, ตำบล, อำเภอ, จังหวัด)
    if data.get('shop_address') and data.get('shop_address') != '-':
        can.drawString(120.0, 512.0, to_thai_digits(data.get('shop_address')))
    if data.get('shop_moo') and data.get('shop_moo') != '-':
        can.drawString(200.0, 512.0, to_thai_digits(data.get('shop_moo')))
    if data.get('shop_subdistrict'):
        can.drawString(265.0, 512.0, str(data.get('shop_subdistrict')))
    if data.get('shop_district'):
        can.drawString(373.0, 512.0, str(data.get('shop_district')))
    if data.get('shop_province'):
        can.drawString(468.0, 512.0, str(data.get('shop_province')))

    # 8. หมายเลขโทรศัพท์สถานประกอบการ
    shop_phone = data.get('shop_phone') or phone
    if shop_phone and shop_phone != '-':
        can.drawString(140.0, 493.3, to_thai_digits(shop_phone))

    # 9. อัตราค่าธรรมเนียมปีละ ... บาท ( ... )
    fee = data.get('fee') or 0
    try:
        fee_float = float(fee)
        fee_str = f"{fee_float:,.2f}"
    except (ValueError, TypeError):
        fee_str = str(fee)
    fee_word = data.get('fee_text') or baht_text(fee)
    if fee_str and fee_str not in ['0', '0.00', '0.0', '-']:
        can.drawString(230.0, 468.6, to_thai_digits(fee_str))
    if fee_word and fee_word != '-':
        can.drawString(325.0, 468.6, str(fee_word))

    # 10. ตามใบเสร็จรับเงินเล่มที่ ... เลขที่ ... ลงวันที่ ...
    receipt_info = str(data.get('receipt_info') or '').strip()
    receipt_date_str = str(data.get('receipt_date') or '').strip()
    if receipt_info and receipt_info not in ['-', 'None', 'ว่าง']:
        can.drawString(165.0, 449.8, to_thai_digits(receipt_info))
    if receipt_date_str and receipt_date_str not in ['-', 'None']:
        can.drawString(360.0, 449.8, str(receipt_date_str))

    # 11. เงื่อนไขพิเศษ ๔.๓. และ ๔.๔. (ถ้ามี)
    if has_cond_3 and cond_3:
        can.drawString(172.0, 262.4, str(cond_3))
    if has_cond_4 and cond_4:
        can.drawString(172.0, 243.7, str(cond_4))

    # 12. (๕) ใบอนุญาตออกให้เมื่อวันที่
    can.drawString(295.0, issue_y, to_thai_digits(data.get('issue_day') or ''))
    can.drawString(355.0, issue_y, str(data.get('issue_month') or ''))
    can.drawString(455.0, issue_y, to_thai_digits(data.get('issue_year') or ''))

    # 13. (๖) ใบอนุญาตสิ้นอายุเมื่อวันที่
    can.drawString(295.0, expire_y, to_thai_digits(data.get('expire_day') or ''))
    can.drawString(355.0, expire_y, str(data.get('expire_month') or ''))
    can.drawString(455.0, expire_y, to_thai_digits(data.get('expire_year') or ''))

    can.save()
    packet.seek(0)

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
        generate_aph2_pdf(cfg['output_path'], cfg['data'])
        print('SUCCESS')
