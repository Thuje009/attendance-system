
import { NextResponse } from "next/server";
import { getToken } from "@/src/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "กรุณาเข้าสู่ระบบใหม่" },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    // ส่งต่อเฉพาะฟิลด์ที่ Backend อนุญาตให้แก้ไข
    const payload: {
      fullName?: string;
      password?: string;
      isActive?: boolean;
    } = {};

    if (typeof body.fullName === "string") {
      payload.fullName = body.fullName;
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      payload.password = body.password;
    }

    if (typeof body.isActive === "boolean") {
      payload.isActive = body.isActive;
    }

    const res = await fetch(
      `${API_URL}/users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

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
