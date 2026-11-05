
import { Suspense } from "react";
import { getCurrentUser } from "@/src/lib/auth/me";
import ChangePasswordForm from "./ChangePasswordForm";

async function Content() {
  const me = await getCurrentUser();

  return (
    <ChangePasswordForm
      required={me.mustChangePassword}
      username={me.username}
    />
  );
}

function PasswordSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="h-36 animate-pulse rounded-[28px] bg-[#eadbd8]" />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="h-[480px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white" />
        <div className="h-[560px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white" />
      </div>
    </div>
  );
}

export default function PasswordPage() {
  return (
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-[#b42332]/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-[#e8b957]/[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <Suspense fallback={<PasswordSkeleton />}>
          <Content />
        </Suspense>
      </div>
    </main>
  );
}
