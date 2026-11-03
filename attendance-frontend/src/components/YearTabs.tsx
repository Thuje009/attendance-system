import Link from "next/link";

export default function YearTabs({
  years,
  selected,
  basePath,
}: {
  years: number[];
  selected: number;
  basePath: string;
}) {
  if (years.length <= 1) return null;

  return (
    <nav aria-label="เลือกปีการศึกษา" className="mb-5 flex flex-wrap gap-2">
      {years.map((y) => (
        <Link
          key={y}
          href={`${basePath}?year=${y}`}
          aria-current={y === selected ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
            y === selected
              ? "border-[#b42332] bg-[#fff0f1] text-[#b42332]"
              : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          }`}
        >
          ปีการศึกษา {y}
        </Link>
      ))}
    </nav>
  );
}