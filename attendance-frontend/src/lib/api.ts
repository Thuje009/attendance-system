
import { redirect } from "next/navigation";
import { getToken } from "@/src/lib/auth";

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getToken();

  if (!token) {
    redirect("/login");
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${path}`,
    {
      ...init,
      cache: init?.cache ?? "no-store",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    // บัญชียังไม่ได้เปลี่ยนรหัสผ่าน: พาไปหน้าเปลี่ยนรหัสแทนการแสดง error
    if (res.status === 403 && err?.code === "PASSWORD_CHANGE_REQUIRED") {
      redirect("/account/password");
    }
    throw new Error(err?.message ?? `เกิดข้อผิดพลาด (${res.status})`);
  }

  return res.json() as Promise<T>;
}
