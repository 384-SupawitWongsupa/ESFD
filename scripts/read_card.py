# -*- coding: utf-8 -*-
import sys
import io
import os
import json
import re
import base64

# Force UTF-8 stdout
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
except Exception:
    pass

def parse_thai_name(raw_name):
    parts = [p.strip() for p in raw_name.split('#') if p.strip()]
    if not parts:
        return {'title': '', 'first_name': '', 'last_name': '', 'full_name': ''}
    
    title = parts[0] if len(parts) > 0 else ''
    first_name = parts[1] if len(parts) > 1 else ''
    last_name = parts[-1] if len(parts) > 2 else (parts[1] if len(parts) > 1 else '')
    
    full_name = f"{title}{first_name} {last_name}".strip()
    return {
        'title': title,
        'first_name': first_name,
        'last_name': last_name,
        'full_name': full_name
    }

def parse_thai_address(raw_addr):
    parts = [p.strip() for p in raw_addr.split('#')]
    house_no = parts[0] if len(parts) > 0 else ''
    moo_raw = parts[1] if len(parts) > 1 else ''
    moo_match = re.search(r'\d+', moo_raw)
    moo = moo_match.group(0) if moo_match else moo_raw.replace('หมู่ที่', '').strip()
    
    trok = parts[2] if len(parts) > 2 else ''
    soi = parts[3] if len(parts) > 3 else ''
    road = parts[4] if len(parts) > 4 else ''
    tambon = parts[5] if len(parts) > 5 else ''
    amphoe = parts[6] if len(parts) > 6 else ''
    province = parts[7] if len(parts) > 7 else ''

    # Clean prefixes
    tambon = re.sub(r'^(ตำบล|ต\.)', '', tambon).strip()
    amphoe = re.sub(r'^(อำเภอ|อ\.)', '', amphoe).strip()
    province = re.sub(r'^(จังหวัด|จ\.)', '', province).strip()

    addr_parts = [house_no]
    if trok: addr_parts.append(trok)
    if soi: addr_parts.append(f"ซอย{soi}")
    if road: addr_parts.append(f"ถนน{road}")
    office_address = ' '.join(filter(None, addr_parts))

    return {
        'office_address': office_address or house_no,
        'moo': moo,
        'subdistrict': tambon or 'ดอยงาม',
        'district': amphoe or 'พาน',
        'province': province or 'เชียงราย',
        'full_address': f"เลขที่ {office_address} หมู่ {moo} ต.{tambon} อ.{amphoe} จ.{province}".strip()
    }

def read_card():
    try:
        from smartcard.System import readers
        from smartcard.Exceptions import NoCardException, CardConnectionException
    except ImportError:
        return {
            'success': False,
            'error': 'ไม่พบไลบรารี pyscard ในระบบ'
        }

    try:
        r_list = readers()
    except Exception as e:
        return {
            'success': False,
            'error': f'ไม่สามารถเข้าถึงระบบ Smart Card ของ Windows ได้: {str(e)}'
        }

    if not r_list:
        return {
            'success': False,
            'error': 'ไม่พบเครื่องอ่านบัตรประชาชน USB ที่เชื่อมต่ออยู่ กรุณาเสียบเครื่องอ่านบัตร'
        }

    # Find the smart card reader
    target_reader = None
    for r in r_list:
        name_lower = r.name.lower()
        if any(k in name_lower for k in ['scr', 'feitian', 'smart', 'card', 'reader', 'ccid']):
            target_reader = r
            break
    
    if not target_reader:
        target_reader = r_list[0]

    try:
        conn = target_reader.createConnection()
        conn.connect()
    except NoCardException:
        return {
            'success': False,
            'error': f'พบเครื่องอ่าน {target_reader.name} แต่ยังไม่ได้เสียบบัตรประชาชน กรุณาเสียบบัตรให้แน่น'
        }
    except CardConnectionException as e:
        return {
            'success': False,
            'error': f'ไม่สามารถเชื่อมต่อกับบัตรประชาชนในเครื่องอ่านได้: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'ข้อผิดพลาดในการเชื่อมต่อเครื่องอ่านบัตร: {str(e)}'
        }

    try:
        # Select Thai National ID Applet
        SELECT_APDU = [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
        conn.transmit(SELECT_APDU)

        def read_apdu(cmd, length):
            conn.transmit(cmd)
            resp, _, _ = conn.transmit([0x00, 0xC0, 0x00, 0x00, length])
            return bytes(resp).decode('tis-620', errors='ignore').strip('\x00').strip()

        # 1. Citizen ID (13 digits)
        cid = read_apdu([0x80, 0xB0, 0x00, 0x04, 0x02, 0x00, 0x0D], 0x0D)
        
        # 2. Thai Full Name
        raw_th_name = read_apdu([0x80, 0xB0, 0x00, 0x11, 0x02, 0x00, 0x64], 0x64)
        th_name = parse_thai_name(raw_th_name)

        # 3. English Full Name
        raw_en_name = read_apdu([0x80, 0xB0, 0x00, 0x75, 0x02, 0x00, 0x64], 0x64)
        en_name = parse_thai_name(raw_en_name)

        # 4. Date of Birth (YYYYMMDD in BE)
        raw_dob = read_apdu([0x80, 0xB0, 0x00, 0xD9, 0x02, 0x00, 0x08], 0x08)

        # 5. Gender
        gender_code = read_apdu([0x80, 0xB0, 0x00, 0xE1, 0x02, 0x00, 0x01], 0x01)
        gender = 'ชาย' if gender_code == '1' else ('หญิง' if gender_code == '2' else 'ไม่ระบุ')

        # 6. Address
        raw_address = read_apdu([0x80, 0xB0, 0x15, 0x79, 0x02, 0x00, 0x64], 0x64)
        addr = parse_thai_address(raw_address)

        # 7. Card Expiry
        raw_expire = read_apdu([0x80, 0xB0, 0x01, 0x6F, 0x02, 0x00, 0x08], 0x08)

        card_data = {
            'citizen_id': cid,
            'title_name': th_name['title'],
            'first_name': th_name['first_name'],
            'last_name': th_name['last_name'],
            'owner_name': th_name['full_name'],
            'en_full_name': en_name['full_name'],
            'birth_date': raw_dob,
            'gender': gender,
            'office_address': addr['office_address'],
            'moo': addr['moo'],
            'subdistrict': addr['subdistrict'],
            'district': addr['district'],
            'province': addr['province'],
            'full_address': addr['full_address'],
            'card_expire_date': raw_expire,
            'reader_name': target_reader.name
        }

        return {
            'success': True,
            'data': card_data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'ไม่สามารถอ่านข้อมูลจากชิปบัตรประชาชนได้: {str(e)}'
        }

if __name__ == '__main__':
    result = read_card()
    json_bytes = json.dumps(result, ensure_ascii=False).encode('utf-8')
    b64_str = base64.b64encode(json_bytes).decode('ascii')
    
    # Write to temp file for direct reading
    try:
        out_file = os.path.join(os.path.dirname(__file__), '..', 'storage', 'app', 'card_read.json')
        with open(out_file, 'wb') as f:
            f.write(json_bytes)
    except Exception:
        pass

    # Print pure ASCII base64 output
    print("CARD_DATA:" + b64_str)
