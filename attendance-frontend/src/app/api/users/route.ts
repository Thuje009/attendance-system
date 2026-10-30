
import { NextResponse } from "next/server";
import { getToken } from "@/src/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function POST(request: Request) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "กรุณาเข้าสู่ระบบใหม่" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password,
        fullName: body.fullName,
        role: "TEACHER",
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? {}, {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถเชื่อมต่อ Backend ได้" },
      { status: 502 },
    );
  }
}
