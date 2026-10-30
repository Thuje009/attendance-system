import { cookies } from "next/headers";

const COOKIE_NAME = "token";

export async function getToken() {
  return (await cookies()).get(COOKIE_NAME)?.value;
}

export async function setToken(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 ชั่วโมง ตรงกับอายุ JWT
  });
}

export async function clearToken() {
  (await cookies()).delete(COOKIE_NAME);
}