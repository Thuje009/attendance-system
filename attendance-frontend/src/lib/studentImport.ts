export type ImportRow = {
  number?: number;
  studentCode: string;
  prefix?: string;
  firstName: string;
  lastName: string;
  birthDate?: string; // YYYY-MM-DD (ค.ศ.)
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  phone?: string;
};

export type ImportRowResult = {
  index: number;
  studentCode: string;
  name: string;
  number: number | null;
  action: "create" | "update" | "error";
  errors: string[];
};

export type ImportResponse = {
  committed: boolean;
  summary: { create: number; update: number; error: number };
  rows: ImportRowResult[];
};

export type ParsedItem = {
  line: number; // ลำดับแถวในข้อความที่วาง
  row: ImportRow;
  clientErrors: string[];
};

// ตำแหน่งคอลัมน์ของแม่แบบไฟล์โรงเรียน (เริ่มนับ 0)
// 5 = เลขบัตรประชาชน, 7-11 = ที่อยู่, 12 = สัญชาติ, 16 = วันเข้าเรียน → ไม่นำเข้า
const COL = {
  number: 0,
  code: 1,
  prefix: 2,
  firstName: 3,
  lastName: 4,
  birthDate: 6,
  father: 13,
  mother: 14,
  guardian: 15,
  phone: 17,
} as const;

const MIN_CELLS = 15; // ต้องมีอย่างน้อยถึงคอลัมน์มารดา

// แยกข้อความที่คัดลอกจากตาราง (TSV หรือ CSV) รองรับเซลล์ที่ขึ้นบรรทัดใหม่ในเครื่องหมายคำพูด
export function parseDelimited(text: string): string[][] {
  const delim = text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === "") {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

// ล้างช่องว่างแปลกๆ และสระ/วรรณยุกต์ไทยที่พิมพ์ซ้ำติดกัน (เช่น "เชีียงใหม่")
export function cleanThai(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/([\u0E31\u0E34-\u0E3A\u0E47-\u0E4E])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const PREFIX_ALIASES: Record<string, string> = {
  "ด.ช.": "เด็กชาย",
  "ดช.": "เด็กชาย",
  "ด.ญ.": "เด็กหญิง",
  "ดญ.": "เด็กหญิง",
};

const MONTHS: Record<string, number> = {
  มค: 1, มกราคม: 1,
  กพ: 2, กุมภาพันธ์: 2,
  มีค: 3, มีนาคม: 3,
  เมย: 4, เมษายน: 4,
  พค: 5, พฤษภาคม: 5,
  มิย: 6, มิถุนายน: 6,
  กค: 7, กรกฎาคม: 7,
  สค: 8, สิงหาคม: 8,
  กย: 9, กันยายน: 9,
  ตค: 10, ตุลาคม: 10,
  พย: 11, พฤศจิกายน: 11,
  ธค: 12, ธันวาคม: 12,
};

function buildIso(day: number, month: number, year: number): string | null {
  const y = year >= 2400 ? year - 543 : year; // พ.ศ. → ค.ศ.
  const d = new Date(Date.UTC(y, month - 1, day));
  if (
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

// รองรับ "10 ก.ค. 2565", "10/07/2565", "2022-07-10"
export function parseThaiDate(input: string): string | null {
  const s = cleanThai(input);
  if (!s) return null;

  let m = s.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[2].replace(/\./g, "")];
    return month ? buildIso(Number(m[1]), month, Number(m[3])) : null;
  }

  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return buildIso(Number(m[1]), Number(m[2]), Number(m[3]));

  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return buildIso(Number(m[3]), Number(m[2]), Number(m[1]));

  return null;
}

// Excel มักตัดเลข 0 หน้าเบอร์มือถือทิ้ง (812345678 → 0812345678)
export function normalizePhone(input: string): string {
  const first = input.split(/[,;\/\n]/)[0] ?? "";
  const digits = first.replace(/[^\d+]/g, "");
  if (!digits) return "";
  return /^[689]\d{8}$/.test(digits) ? `0${digits}` : digits;
}

const MAX_COLS = 30;

// เลขลำดับวันที่ของ Excel (นับจาก 30 ธ.ค. 1899) → "YYYY-MM-DD"
function excelSerialToIso(n: number): string | null {
  if (!Number.isFinite(n) || n < 1 || n >= 2_958_466) return null;
  const ms = Date.UTC(1899, 11, 30) + Math.floor(n) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

const KNOWN_PREFIXES = new Set([
  "เด็กชาย", "เด็กหญิง", "ด.ช.", "ด.ญ.", "ดช.", "ดญ.", "นาย", "นางสาว", "นาง",
]);

// บางไฟล์มีคอลัมน์นำหน้าเพิ่ม ทำให้ทุกคอลัมน์เลื่อน
// หาระยะเลื่อนจากหัวคอลัมน์ "ที่" หรือจากคอลัมน์คำนำหน้าชื่อ
export function detectOffset(table: string[][]): number {
  for (const row of table.slice(0, 10)) {
    const idx = row.findIndex((c) => cleanThai(c) === "ที่");
    if (idx >= 0 && idx <= 5) return idx;
  }

  for (const row of table.slice(0, 30)) {
    for (let c = 0; c <= 7 && c < row.length; c++) {
      if (KNOWN_PREFIXES.has(cleanThai(row[c] ?? ""))) {
        const off = c - COL.prefix;
        if (off >= 0) return off;
      }
    }
  }

  return 0;
}

// แปลงแถวจากชีต (ค่าดิบ) เป็นตารางข้อความ ให้หน้าตาเหมือนที่ได้จากการวาง
export function sheetRowsToTable(rows: unknown[][]): string[][] {
  const plain = rows.map((r) =>
    Array.from({ length: Math.min(r.length, MAX_COLS) }, (_, c) => {
      const v = r[c];
      if (v === null || v === undefined) return "";
      if (v instanceof Date) {
        return Number.isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
      }
      return String(v);
    }),
  );

  // เซลล์วันเกิดที่เป็นวันที่จริงจะมาเป็นตัวเลขลำดับวัน → แปลงเป็นวันที่
  const birthCol = COL.birthDate + detectOffset(plain);

  return rows.map((r, i) => {
    const v = r[birthCol];
    if (typeof v === "number") {
      const iso = excelSerialToIso(v);
      if (iso) {
        const row = plain[i].slice();
        row[birthCol] = iso;
        return row;
      }
    }
    return plain[i];
  });
}

export function parseStudentRows(text: string) {
  return parseStudentTable(parseDelimited(text));
}

export function parseStudentTable(table: string[][]): {
  items: ParsedItem[];
  skipped: number;
} {
  const items: ParsedItem[] = [];
  let skipped = 0;
  const off = detectOffset(table);

  table.forEach((cells, i) => {
    if (cells.every((c) => !c.trim())) return; // แถวว่าง

    const cell = (idx: number) => cleanThai(cells[idx + off] ?? "");

    const isData =
      /^\d+$/.test(cell(COL.number)) &&
      cell(COL.code) !== "" &&
      cell(COL.firstName) !== "";

    if (!isData) {
      skipped++; // ชื่อเรื่อง, หัวตาราง, หรือส่วนที่ขาดจากเซลล์ที่ขึ้นบรรทัดใหม่
      return;
    }

    const clientErrors: string[] = [];

    if (cells.length < MIN_CELLS + off) {
      clientErrors.push(
        "แถวสั้นกว่าปกติ (อาจมีเซลล์ที่ขึ้นบรรทัดใหม่ในไฟล์ต้นฉบับ)",
      );
    }

    // ถ้าคอลัมน์ผู้ปกครอง/บิดา/มารดามีค่าเป็นวันที่ แสดงว่าคอลัมน์ก่อนหน้าเลื่อน
    if ([12, 13, 14, 15].some((idx) => parseThaiDate(cell(idx)) !== null)) {
      clientErrors.push(
        "คอลัมน์เลื่อนตำแหน่ง ตรวจช่องที่อยู่ของแถวนี้ในไฟล์ต้นฉบับ",
      );
    }

    const birthRaw = cell(COL.birthDate);
    const birthIso = birthRaw ? parseThaiDate(birthRaw) : null;
    if (birthRaw && !birthIso) {
      clientErrors.push(`อ่านวันเกิดไม่ได้: "${birthRaw}"`);
    }

    const rawPrefix = cell(COL.prefix);
    if (/^\d+$/.test(rawPrefix)) {
      clientErrors.push(
        "คอลัมน์ไม่ตรงแม่แบบ (ช่องคำนำหน้าเป็นตัวเลข) ตรวจลำดับคอลัมน์ในไฟล์",
      );
    }
    items.push({
      line: i + 1,
      clientErrors,
      row: {
        number: Number(cell(COL.number)),
        studentCode: cell(COL.code),
        prefix: PREFIX_ALIASES[rawPrefix] ?? (rawPrefix || undefined),
        firstName: cell(COL.firstName),
        lastName: cell(COL.lastName),
        birthDate: birthIso ?? undefined,
        fatherName: cell(COL.father) || undefined,
        motherName: cell(COL.mother) || undefined,
        guardianName: cell(COL.guardian) || undefined,
        phone: normalizePhone(cell(COL.phone)) || undefined,
      },
    });
  });

  return { items, skipped };
}