"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/src/lib/auth/me";
import LogoutButton from "@/src/components/LogoutButton";

type NavLinksProps = {
  role: UserRole;
};

const navItems = [
  {
    href: "/classes",
    adminHref: "/classrooms",
    label: "ชั้นเรียน",
    teacherLabel: "ชั้นเรียนของฉัน",
    roles: ["ADMIN", "TEACHER"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
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
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M2 10l10-6 10 6-10 6-10-6Z" />
        <path d="M6 12.5V17c3.5 2.5 8.5 2.5 12 0v-4.5" />
        <path d="M22 10v6" />
      </svg>
    ),
  },
  {
    href: "/students",
    label: "นักเรียน",
    roles: ["ADMIN"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
      className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8"
    >
      <div className="flex min-w-0 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* BRAND */}
        <Link
          href={role === "ADMIN" ? "/classrooms" : "/classes"}
          className="group flex w-fit shrink-0 items-center gap-3 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#b42332]/15"
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[17px] bg-gradient-to-br from-[#d13b4d] via-[#ad2639] to-[#781626] text-xl font-black text-white shadow-[0_6px_18px_rgba(180,35,50,0.22)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_9px_22px_rgba(180,35,50,0.3)]">
            ✓
            <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#ffd36a] to-transparent" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ffd36a] shadow-[0_0_7px_rgba(255,211,106,0.9)]" />
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="text-base font-extrabold tracking-tight text-[var(--heading)] sm:text-lg">
              เช็คชื่อนักเรียน
            </span>
            <span className="mt-0.5 text-[9px] font-bold tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              STUDENT MANAGEMENT
            </span>
          </span>
        </Link>

        {/* MENU + LOGOUT */}
        <div className="flex min-w-0 flex-col gap-2 lg:flex-1 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
          {/* MENU */}
          <div className="w-full min-w-0 lg:w-auto lg:max-w-full">
            <div className="w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-[#f3e5dc] bg-white/75 p-1.5 shadow-[0_3px_14px_rgba(120,53,15,0.045)] backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:w-auto">
              <div className="flex w-max min-w-full items-center gap-1 lg:min-w-0">
                {visibleItems.map((item) => {
                  const href =
                    role === "ADMIN" && "adminHref" in item
                      ? item.adminHref
                      : item.href;

                  const active =
                    pathname === href || pathname.startsWith(`${href}/`);

                  const label =
                    "teacherLabel" in item && role === "TEACHER"
                      ? item.teacherLabel
                      : item.label;

                  return (
                    <Link
                      key={item.href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`
                      group relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#b42332]/15 sm:px-3.5 sm:py-2.5 sm:text-sm
                      ${active
                          ? "bg-gradient-to-br from-[#b42332] to-[#921b2c] text-white shadow-[0_4px_12px_rgba(180,35,50,0.2)]"
                          : "text-[#766b68] hover:bg-[#fff1e8] hover:text-[#a51f30] active:scale-[0.97]"
                        }
                    `}
                    >
                      <span
                        className={`
                        flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200
                        ${active
                            ? "bg-white/15 text-white"
                            : "bg-[#fff1e8] text-[#b42332] group-hover:bg-[#ffe4d5]"
                          }
                      `}
                      >
                        {item.icon}
                      </span>

                      <span>{label}</span>

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd36a] shadow-[0_0_8px_rgba(255,211,106,0.8)]" />
                      )}
                    </Link>
                  );
                })}

                {/* PASSWORD */}
                {role !== "ADMIN" && (() => {
                  const href = "/account/password";
                  const active =
                    pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`
        inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#b42332]/15 sm:px-3.5 sm:py-2.5 sm:text-sm
        ${active
                          ? "bg-gradient-to-br from-[#b42332] to-[#921b2c] text-white shadow-[0_4px_12px_rgba(180,35,50,0.2)]"
                          : "text-[#766b68] hover:bg-[#fff1e8] hover:text-[#a51f30] active:scale-[0.97]"
                        }
      `}
                    >
                      <span
                        className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
          ${active ? "bg-white/15 text-white" : "bg-[#fff1e8] text-[#b42332]"}
        `}
                      >
                        🔒
                      </span>

                      <span>รหัสผ่าน</span>

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd36a]" />
                      )}
                    </Link>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="hidden h-9 w-px shrink-0 bg-gradient-to-b from-transparent via-[#e8cfc5] to-transparent lg:block" />

          {/* LOGOUT */}
          <div className="flex shrink-0 justify-end [&_button]:!inline-flex [&_button]:!items-center [&_button]:!justify-center [&_button]:!gap-2 [&_button]:!rounded-xl [&_button]:!border [&_button]:!border-[#f1d8d8] [&_button]:!bg-[#fff5f3] [&_button]:!px-3.5 [&_button]:!py-2.5 [&_button]:!text-xs [&_button]:!font-bold [&_button]:!text-[#a52a38] [&_button]:!shadow-none [&_button]:!transition-all [&_button]:!duration-200 [&_button]:hover:!-translate-y-0.5 [&_button]:hover:!border-[#b42332] [&_button]:hover:!bg-[#b42332] [&_button]:hover:!text-white [&_button]:hover:!shadow-[0_5px_14px_rgba(180,35,50,0.2)] [&_button]:active:!translate-y-0 sm:[&_button]:!text-sm">
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );

}