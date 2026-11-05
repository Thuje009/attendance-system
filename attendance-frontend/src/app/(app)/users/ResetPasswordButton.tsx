"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";

function randomInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

const pick = (set: string) => set[randomInt(set.length)];

// 10 ตัว มีตัวอักษรและตัวเลขเสมอ ไม่ใช้ตัวที่อ่านสับสน (0 O 1 l I)
function generatePassword(length = 10) {
  const chars = [pick(DIGITS), pick(DIGITS), pick(LETTERS), pick(LETTERS)];
  const all = LETTERS + DIGITS;
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function ResetPasswordButton({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = () => {
    setPassword(generatePassword());
    setDone(false);
    setCopied(false);
    setError(null);
    dialogRef.current?.showModal();
  };

  const close = () => {
    if (pending) return;
    setPassword(""); // ไม่เก็บรหัสชั่วคราวไว้ในหน่วยความจำ
    dialogRef.current?.close();
    if (done) router.refresh();
  };

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const m = data?.message;
          setError(Array.isArray(m) ? m.join(", ") : (m ?? "รีเซ็ตรหัสผ่านไม่สำเร็จ"));
          return;
        }
        setDone(true);
      } catch {
        setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
      }
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        รีเซ็ตรหัสผ่าน
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`reset-${userId}`}
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        onClose={() => setPassword("")}
        className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-0 shadow-[0_24px_60px_rgba(130,28,41,0.25)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="space-y-4 p-6">
          <div>
            <h2 id={`reset-${userId}`} className="font-bold text-[var(--heading)]">
              รีเซ็ตรหัสผ่าน
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">{fullName}</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[#fffcfa] px-4 py-3">
            <p className="text-xs font-semibold text-[var(--muted)]">
              รหัสผ่านชั่วคราว
            </p>
            <p className="mt-1 select-all break-all font-mono text-lg font-bold tracking-wider text-[var(--heading)]">
              {password}
            </p>
          </div>

          {!done ? (
            <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
              เมื่อยืนยัน รหัสเดิมจะใช้ไม่ได้ทันที บัญชีที่ถูกล็อกจะถูกปลดล็อก
              และครูต้องตั้งรหัสผ่านใหม่ตอนเข้าใช้ครั้งแรก
            </p>
          ) : (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              รีเซ็ตเรียบร้อยแล้ว ส่งรหัสนี้ให้ครูโดยตรง
              <b> รหัสนี้จะไม่แสดงอีกหลังปิดหน้าต่าง</b>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {!done ? (
              <>
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  disabled={pending}
                  className="cursor-pointer rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
                >
                  สุ่มใหม่
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="cursor-pointer rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending || !password}
                  className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-bold !text-white shadow-[var(--shadow-button)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "กำลังบันทึก..." : "ยืนยันรีเซ็ต"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={copy}
                  className="cursor-pointer rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--surface-soft)]"
                >
                  {copied ? "คัดลอกแล้ว ✓" : "คัดลอกรหัส"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="cursor-pointer rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-bold !text-white shadow-[var(--shadow-button)]"
                >
                  ปิด
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}