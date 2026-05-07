import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Living Substance Simulation",
  description:
    "Privacy information for Living Substance Simulation, including what the site stores locally and what it does not ask users to submit.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy policy"
      title="Privacy Policy"
      summary="This page explains the small amount of browser-side data used by the site and the limits of what the app collects."
    >
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">What this site does not ask for</h2>
        <p className="mt-3">
          The simulator does not require an account, and it does not ask users to enter names, addresses, medical records, or real patient information in order to view the educational model.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Local browser storage</h2>
        <p className="mt-3">
          The site stores a light or dark theme preference in the browser using local storage so the interface can remember that setting between visits. That preference stays on the user&apos;s device unless the browser is cleared.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Technical logs and hosting</h2>
        <p className="mt-3">
          Like most public websites, normal hosting, browser, and network infrastructure may generate technical logs such as IP address, request path, device details, or timestamps for security, delivery, and reliability purposes. Those logs are handled by the relevant infrastructure providers rather than through a custom user account system inside the app.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Educational use only</h2>
        <p className="mt-3">
          This project is designed as a fictional educational simulation. Users should not submit real medical or emergency information through email or any public channel connected to the site.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Contact</h2>
        <p className="mt-3">
          Privacy questions can be sent to <a href="mailto:david@4ourmedia.com" className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--accent)] underline-offset-4">david@4ourmedia.com</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}