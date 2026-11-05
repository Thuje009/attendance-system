
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getToken } from "@/src/lib/auth";
import { getCurrentUser } from "@/src/lib/auth/me";

async function HomeContent(): Promise<React.ReactElement> {
  const token = await getToken();

  // ยังไม่ได้เข้าสู่ระบบ
  if (!token) {
    return redirect("/login");
  }

  try {
    const me = await getCurrentUser();

    // ต้องเปลี่ยนรหัสผ่านก่อน
    if (me.mustChangePassword) {
      return redirect("/account/password");
    }

    // ADMIN ไปหน้าจัดการชั้นเรียน
    if (me.role === "ADMIN") {
      return redirect("/classrooms");
    }

    // TEACHER ไปหน้าชั้นเรียนปกติ
    return redirect("/classes");
  } catch {
    return redirect("/login");
  }
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f3d9d9] border-t-[#b42332]" />
            <p className="text-sm font-semibold text-[var(--muted)]">
              กำลังตรวจสอบข้อมูลผู้ใช้งาน...
            </p>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
