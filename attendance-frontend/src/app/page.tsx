
import { redirect } from "next/navigation";
import { getToken } from "@/src/lib/auth";
import { getCurrentUser } from "@/src/lib/auth/me";

export default async function Home() {
  const token = await getToken();

  // ยังไม่ได้เข้าสู่ระบบ
  if (!token) {
    redirect("/login");
  }

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  let me;

  try {
    me = await getCurrentUser();
    if (me.mustChangePassword) {
      redirect("/account/password");
    }
  } catch {
    redirect("/login");
  }

  // ADMIN ไปหน้าจัดการชั้นเรียน
  if (me.role === "ADMIN") {
    redirect("/classrooms");
  }

  // TEACHER ไปหน้าชั้นเรียนปกติ
  redirect("/classes");
}
