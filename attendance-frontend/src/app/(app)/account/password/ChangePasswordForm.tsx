
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[#eadbd8] bg-[#fffdfc] px-4 py-3.5 text-sm text-[#54232b] outline-none transition-all placeholder:text-[#c5aeb0] focus:border-[#b42332] focus:ring-4 focus:ring-[#b42332]/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function ChangePasswordForm({
  required,
  username,
}: {
  required: boolean;
  username: string;
}) {
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const rules = [
    { ok: next.length >= 8, label: "มีความยาวอย่างน้อย 8 ตัวอักษร" },
    { ok: /[A-Za-z]/.test(next), label: "มีตัวอักษรภาษาอังกฤษ" },
    { ok: /\d/.test(next), label: "มีตัวเลขอย่างน้อย 1 ตัว" },
    {
      ok: next !== "" && next !== current,
      label: "ไม่ซ้ำกับรหัสผ่านเดิม",
    },
  ];

  const matches = confirm !== "" && confirm === next;

  const canSubmit =
    !pending &&
    current !== "" &&
    rules.every((r) => r.ok) &&
    matches;

  const completedRules = rules.filter((r) => r.ok).length;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canSubmit) return;

    setMsg(null);

    start(async () => {
      try {
        const res = await changePassword(current, next);

        if (!res.ok) {
          setMsg({ ok: false, text: res.error });
          return;
        }

        setCurrent("");
        setNext("");
        setConfirm("");

        if (required) {
          router.replace(res.home);
        } else {
          setMsg({
            ok: true,
            text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
          });
        }
      } catch {
        setMsg({
          ok: false,
          text: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        });
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7f1725] via-[#a51f31] to-[#c43c3c] p-6 text-white shadow-[0_18px_50px_rgba(126,23,37,0.2)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#f5c76b]/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl shadow-inner backdrop-blur-sm">
              🔐
            </div>

            <div>
              <div className="mb-1 text-xs font-bold tracking-[0.2em] text-[#f8d98e]">
                ACCOUNT SECURITY
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                เปลี่ยนรหัสผ่าน
              </h1>
              <p className="mt-1 text-sm text-white/75">
                ตั้งรหัสผ่านใหม่เพื่อรักษาความปลอดภัยของบัญชี
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-[#f5d58b]/30 bg-[#f5d58b]/10 px-4 py-2 text-xs font-semibold text-[#ffe7ad]">
            <span className="h-2 w-2 rounded-full bg-[#f5d58b]" />
            SECURE ACCOUNT
          </div>
        </div>
      </section>

      {required && (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold">
              จำเป็นต้องเปลี่ยนรหัสผ่าน
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              บัญชีของคุณต้องตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน
              เพื่อความปลอดภัยและป้องกันการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">

        {/* Security information */}
        <aside className="flex flex-col rounded-[26px] border border-[#eadbd8] bg-gradient-to-br from-white to-[#fff8f5] p-6 shadow-[0_8px_30px_rgba(84,35,43,0.05)] sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b42332]/10 text-2xl">
            🛡️
          </div>

          <h2 className="mt-5 text-xl font-black text-[#54232b]">
            ปกป้องบัญชีของคุณ
          </h2>

          <p className="mt-2 text-sm leading-7 text-[#92777b]">
            รหัสผ่านที่ดีช่วยป้องกันไม่ให้ผู้อื่นเข้าถึงข้อมูล
            และบัญชีผู้ใช้งานของคุณ
          </p>

          <div className="my-6 h-px bg-[#eee1dd]" />

          <p className="text-xs font-extrabold tracking-wider text-[#a27c51]">
            SECURITY TIPS
          </p>

          <div className="mt-4 space-y-4">
            {[
              {
                icon: "🔑",
                title: "ใช้รหัสผ่านที่คาดเดายาก",
                desc: "หลีกเลี่ยงชื่อ วันเกิด หรือข้อมูลส่วนตัว",
              },
              {
                icon: "🔒",
                title: "ไม่ใช้รหัสผ่านซ้ำ",
                desc: "ไม่ควรใช้รหัสผ่านเดียวกับเว็บไซต์อื่น",
              },
              {
                icon: "🤫",
                title: "เก็บรหัสผ่านเป็นความลับ",
                desc: "ไม่เปิดเผยรหัสผ่านให้ผู้อื่นทราบ",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#54232b]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#92777b]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-2xl border border-[#f0dfb8] bg-[#fff9eb] p-4">
              <p className="text-xs font-bold text-[#9b7435]">
                ✨ คำแนะนำ
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#9b8054]">
                ควรใช้รหัสผ่านที่มีทั้งตัวอักษรและตัวเลข
                และไม่ควรบอกรหัสผ่านให้ผู้อื่นทราบ
              </p>
            </div>
          </div>
        </aside>

        {/* Change password form */}
        <section className="rounded-[26px] border border-[#eadbd8] bg-white p-5 shadow-[0_8px_30px_rgba(84,35,43,0.06)] sm:p-8">

          <div className="mb-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#54232b]">
                ตั้งค่ารหัสผ่านใหม่
              </h2>
              <span className="rounded-full bg-[#b42332]/5 px-3 py-1.5 text-[10px] font-bold text-[#b42332]">
                PASSWORD SETTINGS
              </span>
            </div>
            <p className="mt-2 text-xs text-[#a58b8e]">
              กรอกข้อมูลให้ครบถ้วนเพื่อเปลี่ยนรหัสผ่าน
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">

            {/* Username for password manager */}
            <input
              type="text"
              autoComplete="username"
              defaultValue={username}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />

            {/* Current password */}
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-xs font-bold text-[#54232b]">
                <span>🔑</span>
                รหัสผ่านปัจจุบัน
              </span>
              <input
                className={inputCls}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                disabled={pending}
                required
              />
            </label>

            {/* New password */}
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-xs font-bold text-[#54232b]">
                <span>✨</span>
                รหัสผ่านใหม่
              </span>
              <input
                className={inputCls}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="กำหนดรหัสผ่านใหม่"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                disabled={pending}
                required
              />
            </label>

            {/* Password requirements */}
            <div className="rounded-2xl border border-[#eee1dd] bg-[#fffaf8] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#54232b]">
                  เงื่อนไขรหัสผ่าน
                </p>
                <span className="text-[10px] font-bold text-[#a58b8e]">
                  {completedRules}/4 ผ่านแล้ว
                </span>
              </div>

              <div className="mb-3 flex gap-1.5">
                {rules.map((r) => (
                  <div
                    key={r.label}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      r.ok ? "bg-[#16845b]" : "bg-[#eadbd8]"
                    }`}
                  />
                ))}
              </div>

              <ul className="grid gap-2 text-xs sm:grid-cols-2">
                {rules.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center gap-2 ${
                      r.ok ? "text-[#16845b]" : "text-[#a58b8e]"
                    }`}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px]">
                      {r.ok ? "✓" : "○"}
                    </span>
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm password */}
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-xs font-bold text-[#54232b]">
                <span>🛡️</span>
                ยืนยันรหัสผ่านใหม่
              </span>
              <input
                className={inputCls}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={pending}
                required
              />

              {confirm !== "" && (
                <p
                  className={`text-xs font-medium ${
                    matches ? "text-[#16845b]" : "text-red-600"
                  }`}
                >
                  {matches
                    ? "✓ รหัสผ่านตรงกัน"
                    : "✕ รหัสผ่านไม่ตรงกัน"}
                </p>
              )}
            </label>

            {/* Show password */}
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-[#92777b]">
              <input
                type="checkbox"
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#b42332]"
              />
              แสดงรหัสผ่านทั้งหมด
            </label>

            {/* Feedback */}
            {msg && (
              <div
                role={msg.ok ? "status" : "alert"}
                aria-live="polite"
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                  msg.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span className="text-base">
                  {msg.ok ? "✓" : "⚠"}
                </span>
                {msg.text}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f1d2b] via-[#b42332] to-[#cf4650] px-6 py-4 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(180,35,50,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(180,35,50,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังบันทึกรหัสผ่าน...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  บันทึกรหัสผ่านใหม่
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] leading-relaxed text-[#b49da0]">
              การเปลี่ยนรหัสผ่านจะมีผลกับบัญชีผู้ใช้งานนี้
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
