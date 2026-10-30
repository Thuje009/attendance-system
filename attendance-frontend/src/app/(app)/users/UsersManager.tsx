
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { ManagedUser } from "./page";

type Props = {
  initialUsers: ManagedUser[];
};

type UserForm = {
  username: string;
  fullName: string;
  password: string;
};

const emptyForm: UserForm = {
  username: "",
  fullName: "",
  password: "",
};

export default function UsersManager({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function request(
    path: string,
    method: string,
    body?: Record<string, unknown>,
  ) {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message;
      throw new Error(message || `เกิดข้อผิดพลาด (${res.status})`);
    }

    return data;
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(user: ManagedUser) {
    setEditing(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      password: "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (editing) {
        const body: Record<string, unknown> = {
          fullName: form.fullName.trim(),
        };

        if (form.password.trim()) {
          body.password = form.password;
        }

        const updated = await request(
          `/api/users/${editing.id}`,
          "PATCH",
          body,
        );

        setUsers((current) =>
          current.map((user) =>
            user.id === editing.id ? updated : user,
          ),
        );
        setSuccess("บันทึกการแก้ไขเรียบร้อยแล้ว");
      } else {
        const created = await request("/api/users", "POST", {
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          password: form.password,
          role: "TEACHER",
        });

        setUsers((current) => [...current, created]);
        setSuccess("เพิ่มบัญชีครูเรียบร้อยแล้ว");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่",
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    const action = user.isActive ? "ปิด" : "เปิด";

    if (!window.confirm(`ยืนยัน${action}บัญชี ${user.fullName} หรือไม่?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const updated = await request(`/api/users/${user.id}`, "PATCH", {
        isActive: !user.isActive,
      });

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? updated : item)),
      );
      setSuccess(`${action}บัญชีเรียบร้อยแล้ว`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="ผู้ใช้งานทั้งหมด" value={users.length} icon="♙" />
        <StatCard label="บัญชีที่เปิดใช้งาน" value={activeCount} icon="✓" />
        <StatCard label="บัญชีที่ปิดใช้งาน" value={users.length - activeCount} icon="Ⅱ" />
      </div>

      {(error || success) && (
        <div
          role="status"
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <h2 className="text-lg font-bold text-[var(--heading)]">
              รายชื่อผู้ใช้งาน
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              จัดการบัญชีครูและผู้ดูแลระบบ
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <span className="text-lg">+</span> เพิ่มบัญชีครู
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[var(--surface-soft)] text-xs font-semibold tracking-wide text-[var(--muted)]">
                <th className="whitespace-nowrap px-5 py-4 sm:px-7">ชื่อ - นามสกุล</th>
                <th className="px-5 py-4">ชื่อผู้ใช้</th>
                <th className="px-5 py-4">บทบาท</th>
                <th className="px-5 py-4">สถานะ</th>
                <th className="whitespace-nowrap px-5 py-4">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[var(--muted)]">
                    ยังไม่มีบัญชีผู้ใช้งาน
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <td className="whitespace-nowrap px-5 py-5 font-semibold text-[var(--foreground)] sm:px-7">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0ee] font-bold text-[var(--primary)]">
                          {user.fullName.slice(0, 1)}
                        </div>
                        {user.fullName}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-[var(--muted)]">
                      @{user.username}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "border border-[#f5dca7] bg-[var(--badge-bg)] text-[var(--badge-text)]"
                          : "bg-[#f3f0ff] text-[#6b4bb5]"
                      }`}>
                        {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ครู"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`} />
                        {user.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openEdit(user)}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleActive(user)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                            user.isActive
                              ? "border-red-100 text-red-600 hover:bg-red-50"
                              : "border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {user.isActive ? "ปิดบัญชี" : "เปิดบัญชี"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#261216]/45 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
            className="my-auto w-full max-w-lg rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-[var(--badge-text)]">
                  TEACHER ACCOUNT
                </p>
                <h2 id="user-form-title" className="mt-2 text-xl font-extrabold text-[var(--heading)]">
                  {editing ? "แก้ไขบัญชีผู้ใช้" : "เพิ่มบัญชีครู"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-3 py-2 text-lg text-[var(--muted)] hover:bg-[#fff2ee]"
                aria-label="ปิดหน้าต่าง"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!editing && (
                <Field label="ชื่อผู้ใช้" hint="ใช้สำหรับเข้าสู่ระบบ">
                  <input
                    required
                    minLength={3}
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className={inputClass}
                    placeholder="เช่น teacher01"
                  />
                </Field>
              )}

              <Field label="ชื่อ - นามสกุล">
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={inputClass}
                  placeholder="กรอกชื่อและนามสกุล"
                />
              </Field>

              <Field
                label={editing ? "รหัสผ่านใหม่ (ไม่บังคับ)" : "รหัสผ่าน"}
                hint={editing ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "ควรใช้รหัสผ่านที่คาดเดายาก"}
              >
                <input
                  required={!editing}
                  minLength={8}
                  type="password"
                  autoComplete={editing ? "new-password" : "new-password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  placeholder={editing ? "กรอกเมื่อต้องการเปลี่ยนรหัสผ่าน" : "อย่างน้อย 8 ตัวอักษร"}
                />
              </Field>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[#fff8f4] disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "สร้างบัญชีครู"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[#b4a4a3] focus:border-[var(--primary)] focus:ring-4 focus:ring-[#b42332]/10";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--heading)]">
      {label}
      {hint && (
        <span className="mt-1 block text-xs font-normal text-[var(--muted)]">
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ee] text-lg font-bold text-[var(--primary)]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--heading)]">
        {value}
      </p>
    </div>
  );
}
