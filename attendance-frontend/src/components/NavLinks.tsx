
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/src/lib/auth/me";

type NavLinksProps = {
  role: UserRole;
};

const navItems = [
  {
    href: "/classes",
    adminHref: "/classrooms",
    label: "ชั้นเรียน",
    roles: ["ADMIN", "TEACHER"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden="true"
      >
        <path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-7h6v7M9 10h.01M15 10h.01" />
      </svg>
    ),
  },
  {
    href: "/users",
    label: "ครู",
    roles: ["ADMIN"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden="true"
      >
        <path d="M2 10l10-6 10 6-10 6-10-6Z" />
        <path d="M6 12.5V17c3.5 2.5 8.5 2.5 12 0v-4.5" />
        <path d="M22 10v6" />
      </svg>
    ),
  },
] as const;

export default function NavLinks({ role }: NavLinksProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(role)
  );

  return (
    <nav
      aria-label="เมนูหลัก"
      className="flex items-center gap-1"
    >
      {visibleItems.map((item) => {

        // ADMIN ไปหน้าจัดการชั้นเรียน
        // TEACHER ไปหน้าชั้นเรียนปกติ
        const href =
          role === "ADMIN" && "adminHref" in item
            ? item.adminHref
            : item.href;

        const active =
          pathname === href ||
          pathname.startsWith(`${href}/`);

        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`
              relative inline-flex items-center gap-2
              rounded-xl px-3 py-2.5
              text-sm font-semibold
              transition-all duration-200
              outline-none focus-visible:ring-4
              focus-visible:ring-[#b42332]/15
              sm:px-4
              ${
                active
                  ? "bg-[#fff0f0] text-[#b42332]"
                  : "text-[var(--muted)] hover:bg-[#fff5e8] hover:text-[var(--heading)]"
              }
            `}
          >
            {active && (
              <span
                className="
                  absolute bottom-0 left-3 right-3
                  h-[2px] rounded-full bg-[#b42332]
                "
              />
            )}

            {item.icon}

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
