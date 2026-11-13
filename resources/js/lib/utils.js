import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * แปลงวันที่ ISO หรือ Y-m-d เป็นรูปแบบวันที่ไทยทางการ (พ.ศ.)
 * ตัวอย่าง: '2026-12-02T00:00:00.000000Z' -> '2 ธ.ค. 2569'
 */
export function formatThaiDate(dateString, isShort = false) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return String(dateString);

        const thaiMonthsFull = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        const thaiMonthsShort = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];

        const day = d.getDate();
        const month = isShort ? thaiMonthsShort[d.getMonth()] : thaiMonthsFull[d.getMonth()];
        const year = d.getFullYear() + 543;

        return `${day} ${month} ${year}`;
    } catch {
        return String(dateString);
    }
}

/**
 * แปลงเลขประจำตัวประชาชน 13 หลัก เป็นรูปแบบมาตรฐาน 1-XXXX-XXXXX-XX-X
 */
export function formatCitizenId(id) {
    if (!id) return '-';
    const clean = String(id).replace(/\D/g, '');
    if (clean.length === 13) {
        return clean.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
    }
    return String(id);
}

/**
 * จัดรูปแบบเบอร์โทรศัพท์
 */
export function formatPhone(phone) {
    if (!phone) return '-';
    const clean = String(phone).replace(/\D/g, '');
    if (clean.length === 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    if (clean.length === 9) {
        return clean.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return String(phone);
}
