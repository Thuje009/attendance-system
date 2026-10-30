"use server";

import { redirect } from "next/navigation";
import { clearToken, setToken } from "@/src/lib/auth";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: formData.get("username"),
      password: formData.get("password"),
    }),
  });

  if (!res.ok) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  const data = await res.json();
  await setToken(data.accessToken);
  redirect(data.user.role === "ADMIN" ? "/classrooms" : "/classes");
}

export async function logoutAction() {
  await clearToken();
  redirect("/login");
}