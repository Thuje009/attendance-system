"use server";

import { unstable_rethrow } from "next/navigation";
import { api } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth";

type Result = { ok: true; home: string } | { ok: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<Result> {
  try {
    const res = await api<{ accessToken: string; user: { role: string } }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );

    // token เก่าใช้ไม่ได้แล้ว เก็บใบใหม่ไว้ ผู้ใช้จะได้ไม่หลุดจากระบบ
    await setToken(res.accessToken);

    return {
      ok: true,
      home: res.user.role === "ADMIN" ? "/classrooms" : "/classes",
    };
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, error: (e as Error).message };
  }
}