
import { logoutAction } from "@/src/app/login/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="
          group inline-flex items-center justify-center gap-2
          rounded-xl
          border border-[#F5D5D8]
          bg-[#FFF0F0]
          px-4 py-2.5
          text-sm font-semibold text-[#B42332]
          shadow-sm
          transition-all duration-200
          hover:-translate-y-0.5
          hover:border-[#B42332]
          hover:bg-[#B42332]
          hover:!text-white
          hover:shadow-[0_6px_16px_rgba(180,35,50,0.18)]
          active:translate-y-0
          cursor-pointer
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>

        <span>ออกจากระบบ</span>
      </button>
    </form>
  );
}
