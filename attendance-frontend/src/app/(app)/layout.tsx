
import { Suspense } from "react";
import Link from "next/link";

import LogoutButton from "@/src/components/LogoutButton";
import NavLinks from "@/src/components/NavLinks";
import { getCurrentUser } from "@/src/lib/auth/me";

async function HeaderContent() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 shadow-[0_2px_12px_rgba(130,28,41,0.035)] backdrop-blur-xl">
      <nav className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/classes"
          className="group flex shrink-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-[#b42332]/15"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[image:var(--gradient-primary)] text-lg font-bold text-white shadow-[0_5px_14px_rgba(180,35,50,0.2)] transition-transform duration-200 group-hover:scale-105">
            ✓
          </span>

          <span className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-[var(--heading)] sm:text-lg">
              เช็คชื่อนักเรียน
            </span>

            <span className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)] sm:text-[11px]">
              STUDENT MANAGEMENT
            </span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLinks role={user.role} />

          <div className="mx-1 hidden h-8 w-px bg-[var(--border)] sm:block" />

          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-[#F5E8E2]" />
      </div>
    </header>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Suspense fallback={<HeaderFallback />}>
        <HeaderContent />
      </Suspense>

      <div>{children}</div>
    </div>
  );
}
