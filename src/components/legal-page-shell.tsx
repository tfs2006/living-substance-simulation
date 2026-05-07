import type { ReactNode } from "react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";

export function LegalPageShell({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="glass-panel-strong rounded-[2rem] px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
              {eyebrow}
            </p>
            <h1 className="section-title mt-3 text-5xl leading-[0.95] font-medium tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-8 text-[color:var(--muted)] md:text-lg">
              {summary}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-transform hover:-translate-y-0.5"
          >
            Back to simulator
          </Link>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-6 py-7 md:px-8 md:py-8">
        <div className="grid gap-6 text-sm leading-7 text-[color:var(--muted)] md:text-base md:leading-8">
          {children}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}