import Link from "next/link";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="glass-panel rounded-[2rem] px-5 py-5 md:px-6 md:py-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
            Contact and legal
          </p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            Questions, corrections, or takedown requests can be sent to{" "}
            <a
              href="mailto:david@4ourmedia.com"
              className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--accent)] underline-offset-4"
            >
              david@4ourmedia.com
            </a>
            . These pages set baseline public-site disclosures, but they are not a substitute for jurisdiction-specific legal advice.
          </p>
        </div>

        <nav aria-label="Legal navigation" className="flex flex-wrap gap-3">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}