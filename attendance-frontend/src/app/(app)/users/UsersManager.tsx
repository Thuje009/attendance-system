
"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { ManagedUser } from "./page";
import ResetPasswordButton from "./ResetPasswordButton";

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

const inputClass =
  "mt-2 w-full rounded-xl border border-[#eadbd8] bg-[#fffdfc] px-4 py-3.5 text-sm text-[#54232b] outline-none transition placeholder:text-[#c5aeb0] focus:border-[#b42332] focus:ring-4 focus:ring-[#b42332]/10 disabled:opacity-60";

export default function UsersManager({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาด กรุณาลองใหม่",
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    const action = user.isActive ? "ปิด" : "เปิด";

    if (
      !window.confirm(
        `ยืนยัน${action}บัญชี ${user.fullName} หรือไม่?`,
      )
    ) {
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
        current.map((item) =>
          item.id === user.id ? updated : item,
        ),
      );

      setSuccess(`${action}บัญชีเรียบร้อยแล้ว`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เปลี่ยนสถานะไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  const activeCount = users.filter((user) => user.isActive).length;
  const adminCount = users.filter(
    (user) => user.role === "ADMIN",
  ).length;

  const filteredUsers = users.filter((user) => {
    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      `${user.fullName} ${user.username}`.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && user.isActive) ||
      (statusFilter === "INACTIVE" && !user.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto w-full space-y-7">

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7f1725] via-[#a51f31] to-[#c43c3c] p-6 text-white shadow-[0_18px_50px_rgba(126,23,37,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#f5c76b]/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl shadow-inner backdrop-blur-sm">
              👥
            </div>

            <div>
              <p className="mb-1 text-xs font-bold tracking-[0.2em] text-[#f8d98e]">
                USER MANAGEMENT
              </p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                จัดการผู้ใช้งาน
              </h1>
              <p className="mt-1 text-sm text-white/75">
                จัดการบัญชีครูและผู้ดูแลระบบของโรงเรียน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#f5d58b]/30 bg-[#f5d58b] px-5 py-3.5 text-sm font-extrabold text-[#70202a] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffe5a8]"
          >
            <span className="text-xl leading-none">+</span>
            เพิ่มบัญชีครู
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="ผู้ใช้งานทั้งหมด"
          value={users.length}
          icon="♙"
          color="ruby"
          description="บัญชีในระบบทั้งหมด"
        />
        <StatCard
          label="บัญชีที่ใช้งาน"
          value={activeCount}
          icon="✓"
          color="green"
          description="บัญชีที่เปิดใช้งาน"
        />
        <StatCard
          label="บัญชีที่ปิดใช้งาน"
          value={users.length - activeCount}
          icon="Ⅱ"
          color="gray"
          description="บัญชีที่ถูกระงับ"
        />
        <StatCard
          label="ผู้ดูแลระบบ"
          value={adminCount}
          icon="♛"
          color="gold"
          description="บัญชีระดับผู้ดูแล"
        />
      </section>

      {/* Feedback */}
      {(error || success) && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span className="text-lg">
            {error ? "⚠️" : "✓"}
          </span>
          {error || success}
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
            className="ml-auto rounded-lg px-2 py-1 text-lg opacity-60 hover:opacity-100"
            aria-label="ปิดข้อความ"
          >
            ×
          </button>
        </div>
      )}

      {/* User list */}
      <section className="overflow-hidden rounded-[26px] border border-[#eadbd8] bg-white shadow-[0_8px_30px_rgba(84,35,43,0.05)]">

        {/* Header */}
        <div className="border-b border-[#eee1dd] px-5 py-6 sm:px-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#b42332]" />
                <h2 className="text-lg font-black text-[#54232b]">
                  รายชื่อผู้ใช้งาน
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#a58b8e]">
                จัดการข้อมูลบัญชี สิทธิ์ และสถานะการใช้งาน
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#f0dfb8] bg-[#fff9eb] px-3 py-1.5 text-xs font-bold text-[#9b7435]">
              {filteredUsers.length} / {users.length} บัญชี
            </span>
          </div>

          {/* Search and filter */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b49da0]">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรือชื่อผู้ใช้..."
                className="w-full rounded-xl border border-[#eadbd8] bg-[#fffdfc] py-3 pl-11 pr-4 text-sm text-[#54232b] outline-none transition placeholder:text-[#c5aeb0] focus:border-[#b42332] focus:ring-4 focus:ring-[#b42332]/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="กรองสถานะบัญชี"
              className="cursor-pointer rounded-xl border border-[#eadbd8] bg-[#fffdfc] px-4 py-3 text-sm text-[#54232b] outline-none focus:border-[#b42332] focus:ring-4 focus:ring-[#b42332]/10 sm:w-48"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">ใช้งาน</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#fff9f7] text-[11px] font-bold tracking-wider text-[#a58b8e]">
                <th className="whitespace-nowrap px-7 py-4">
                  ชื่อ - นามสกุล
                </th>
                <th className="px-5 py-4">ชื่อผู้ใช้</th>
                <th className="px-5 py-4">บทบาท</th>
                <th className="px-5 py-4">สถานะ</th>
                <th className="whitespace-nowrap px-5 py-4">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f1e8e5] text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-[#a58b8e]"
                  >
                    <div className="text-3xl">🔎</div>
                    <p className="mt-3 font-semibold">
                      ไม่พบข้อมูลผู้ใช้งาน
                    </p>
                    <p className="mt-1 text-xs">
                      ลองเปลี่ยนคำค้นหาหรือตัวกรอง
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-[#fffaf8]"
                  >
                    <td className="whitespace-nowrap px-7 py-5 font-semibold text-[#54232b]">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.fullName} />
                        {user.fullName}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-[#92777b]">
                      @{user.username}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <StatusBadge active={user.isActive} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <UserActions
                        user={user}
                        busy={busy}
                        onEdit={openEdit}
                        onToggle={toggleActive}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-4 md:hidden">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-[#a58b8e]">
              <div className="text-3xl">🔎</div>
              <p className="mt-3 text-sm font-semibold">
                ไม่พบข้อมูลผู้ใช้งาน
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl border border-[#eee1dd] bg-[#fffdfc] p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={user.fullName} size="large" />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold text-[#54232b]">
                      {user.fullName}
                    </p>
                    <p className="mt-1 text-xs text-[#a58b8e]">
                      @{user.username}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <RoleBadge role={user.role} />
                      <StatusBadge active={user.isActive} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#eee1dd] pt-3">
                  <UserActions
                    user={user}
                    busy={busy}
                    onEdit={openEdit}
                    onToggle={toggleActive}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1 border-t border-[#eee1dd] bg-[#fffaf8] px-5 py-4 text-xs text-[#a58b8e] sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span>แสดง {filteredUsers.length} บัญชี</span>
          <span>ระบบจัดการบัญชีผู้ใช้งาน</span>
        </div>
      </section>

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#261216]/55 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
            className="my-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[26px] border border-[#eadbd8] bg-white shadow-[0_30px_100px_rgba(60,15,23,0.3)]"
          >
            {/* Modal hero */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#7f1725] to-[#b42332] px-6 py-6 text-white sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border border-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#f8d98e]">
                    TEACHER ACCOUNT
                  </p>
                  <h2
                    id="user-form-title"
                    className="mt-2 text-xl font-black"
                  >
                    {editing ? "แก้ไขบัญชีผู้ใช้" : "เพิ่มบัญชีครู"}
                  </h2>
                  <p className="mt-1 text-xs text-white/70">
                    {editing
                      ? "แก้ไขรายละเอียดบัญชีผู้ใช้งาน"
                      : "สร้างบัญชีสำหรับครูเข้าสู่ระบบ"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={busy}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
                  aria-label="ปิดหน้าต่าง"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal form */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
                {!editing && (
                  <Field
                    label="ชื่อผู้ใช้"
                    hint="ใช้สำหรับเข้าสู่ระบบ เช่น teacher01"
                  >
                    <input
                      required
                      minLength={3}
                      autoComplete="username"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className={inputClass}
                      placeholder="กรอกชื่อผู้ใช้"
                    />
                  </Field>
                )}

                <Field label="ชื่อ - นามสกุล" hint="ชื่อจริงและนามสกุลของครู">
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className={inputClass}
                    placeholder="กรอกชื่อและนามสกุล"
                  />
                </Field>

                <Field
                  label={editing ? "รหัสผ่านใหม่ (ไม่บังคับ)" : "รหัสผ่าน"}
                  hint={
                    editing
                      ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                      : "กำหนดรหัสผ่านอย่างน้อย 8 ตัวอักษร"
                  }
                >
                  <input
                    required={!editing}
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={inputClass}
                    placeholder={
                      editing
                        ? "กรอกเมื่อต้องการเปลี่ยนรหัสผ่าน"
                        : "อย่างน้อย 8 ตัวอักษร"
                    }
                  />
                </Field>

                <div className="rounded-xl border border-[#f0dfb8] bg-[#fff9eb] p-4">
                  <p className="text-xs font-bold text-[#9b7435]">
                    ✨ สิทธิ์บัญชี
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#9b8054]">
                    บัญชีที่สร้างจากหน้านี้จะได้รับบทบาทเป็นครู (TEACHER)
                    โดยอัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#eee1dd] bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-[#eadbd8] px-5 py-3 text-sm font-bold text-[#92777b] transition hover:bg-[#fff8f4] disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-gradient-to-r from-[#8f1d2b] to-[#c43c3c] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(180,35,50,0.2)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy
                    ? "กำลังบันทึก..."
                    : editing
                      ? "บันทึกการแก้ไข"
                      : "สร้างบัญชีครู"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Components -------------------- */

function Avatar({
  name,
  size = "normal",
}: {
  name: string;
  size?: "normal" | "large";
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-[#f0d8d5] bg-gradient-to-br from-[#fff0ee] to-[#fce2dc] font-black text-[#a51f31] ${
        size === "large" ? "h-12 w-12 text-lg" : "h-10 w-10 text-sm"
      }`}
    >
      {name.trim().slice(0, 1) || "?"}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "ADMIN";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        isAdmin
          ? "border border-[#f0dfb8] bg-[#fff9eb] text-[#9b7435]"
          : "border border-[#e8ddf7] bg-[#f5f0ff] text-[#7652a8]"
      }`}
    >
      <span>{isAdmin ? "♛" : "♙"}</span>
      {isAdmin ? "ผู้ดูแลระบบ" : "ครู"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {active ? "ใช้งาน" : "ปิดใช้งาน"}
    </span>
  );
}

function UserActions({
  user,
  busy,
  onEdit,
  onToggle,
}: {
  user: ManagedUser;
  busy: boolean;
  onEdit: (user: ManagedUser) => void;
  onToggle: (user: ManagedUser) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ResetPasswordButton
        userId={user.id}
        fullName={user.fullName}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => onEdit(user)}
        className="rounded-lg border border-[#eadbd8] px-3 py-2 text-xs font-bold text-[#54232b] transition hover:border-[#b42332] hover:bg-[#fff8f6] hover:text-[#b42332] disabled:opacity-50"
      >
        แก้ไข
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => onToggle(user)}
        className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
          user.isActive
            ? "border-red-100 text-red-600 hover:bg-red-50"
            : "border-emerald-100 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {user.isActive ? "ปิดบัญชี" : "เปิดบัญชี"}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-[#54232b]">
      {label}
      {hint && (
        <span className="mt-1 block text-xs font-normal text-[#a58b8e]">
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
  color,
  description,
}: {
  label: string;
  value: number;
  icon: string;
  color: "ruby" | "green" | "gray" | "gold";
  description: string;
}) {
  const styles = {
    ruby: {
      icon: "bg-[#fff0ee] text-[#b42332]",
      number: "text-[#a51f31]",
      line: "bg-[#b42332]",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700",
      number: "text-emerald-700",
      line: "bg-emerald-500",
    },
    gray: {
      icon: "bg-gray-100 text-gray-500",
      number: "text-gray-600",
      line: "bg-gray-400",
    },
    gold: {
      icon: "bg-[#fff9eb] text-[#a27a32]",
      number: "text-[#9b7435]",
      line: "bg-[#d7aa4b]",
    },
  };

  const style = styles[color];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#eadbd8] bg-white p-5 shadow-[0_6px_24px_rgba(84,35,43,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(84,35,43,0.08)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${style.line}`} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-[#92777b]">{label}</p>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${style.icon}`}
        >
          {icon}
        </span>
      </div>

      <p className={`mt-3 text-3xl font-black tracking-tight ${style.number}`}>
        {value}
      </p>

      <p className="mt-1 text-[11px] text-[#b49da0]">
        {description}
      </p>
    </div>
  );
}
