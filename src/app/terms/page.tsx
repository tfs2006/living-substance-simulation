import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Use | Living Substance Simulation",
  description:
    "Terms of use for Living Substance Simulation, including educational-only use, no medical advice, and limits on harmful use.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms of use"
      title="Terms of Use"
      summary="These terms set the baseline rules for using the public educational simulator."
    >
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Educational scope</h2>
        <p className="mt-3">
          Living Substance Simulation is provided as an educational, fictional, rule-based visualization tool. It is not medical advice, not diagnosis, not treatment guidance, and not a prediction about any real person.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">No professional relationship</h2>
        <p className="mt-3">
          Using the site does not create a clinician-patient, therapist-client, legal, or other professional advisory relationship.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">No harmful-use optimization</h2>
        <p className="mt-3">
          The site must not be used to plan, encourage, or optimize dangerous substance use. The simulator is designed to explain instability, uncertainty, rebound effects, and safety concerns rather than to improve use outcomes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">No guarantee of accuracy</h2>
        <p className="mt-3">
          The model is simplified on purpose. Outputs may be incomplete, wrong, or inappropriate for real-world decision making. Users are responsible for how they interpret the content.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Emergency and clinical care</h2>
        <p className="mt-3">
          If symptoms are severe or urgent, the correct response is real emergency or clinical care, not reliance on this site. In the United States, call or text 988 for immediate mental health crisis support.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Contact</h2>
        <p className="mt-3">
          Questions about these terms can be sent to <a href="mailto:david@4ourmedia.com" className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--accent)] underline-offset-4">david@4ourmedia.com</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}