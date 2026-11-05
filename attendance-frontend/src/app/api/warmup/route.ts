import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // อ่านค่าจาก request ทำให้เส้นทางนี้ทำงานตอนมีคำขอจริงเสมอ ไม่ถูกสร้างล่วงหน้าตอน build
  const wait = new URL(request.url).searchParams.get("wait") !== "0";
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  const ping = fetch(`${base}/health`, {
    cache: "no-store",
    signal: AbortSignal.timeout(90_000),
  })
    .then((r) => r.ok)
    .catch(() => false);

  // ?wait=0 → ตอบทันที ปล่อยให้ backend ตื่นอยู่เบื้องหลัง
  if (!wait) {
    void ping;
    return NextResponse.json({ web: "ok", api: "waking" });
  }

  const ok = await ping;
  return NextResponse.json(
    { web: "ok", api: ok ? "ok" : "timeout" },
    { status: ok ? 200 : 503 },
  );
}