
import { Suspense } from "react";
import Link from "next/link";

import NavLinks from "@/src/components/NavLinks";
import { getCurrentUser } from "@/src/lib/auth/me";

async function HeaderContent() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 shadow-[0_2px_12px_rgba(130,28,41,0.035)] backdrop-blur-xl">
      <NavLinks role={user.role} />
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
