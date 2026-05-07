import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Educational and Medical Disclaimer | Living Substance Simulation",
  description:
    "Educational and medical disclaimer for Living Substance Simulation, including model limits and emergency warnings.",
  alternates: {
    canonical: "/disclaimer",
  },
};

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="Educational and medical disclaimer"
      title="Disclaimer"
      summary="This page states the limits of the simulation and the situations where real-world care matters more than any modeled output."
    >
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Fictional model</h2>
        <p className="mt-3">
          The simulator represents a fictional human-like nervous system. It does not use real patient data, and it does not claim to reflect any specific person, diagnosis, or clinical case.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Simplified rules, not clinical precision</h2>
        <p className="mt-3">
          The engine uses simplified rules to illustrate broad educational patterns such as short-term relief, rebound anxiety, sleep disruption, craving, shakiness risk, and uncertainty. It does not know exact biology, exact dose effects, or personal medical history.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Not diagnosis or treatment</h2>
        <p className="mt-3">
          Nothing on this site should be used as diagnosis, detox planning, withdrawal management, or treatment advice. The app should not replace a licensed clinician, emergency service, or local medical guidance.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Severe symptoms need real care</h2>
        <p className="mt-3">
          Severe shaking, seizures, confusion, hallucinations, chest pain, fainting, trouble breathing, or inability to stay awake need real medical care now. If someone may harm themselves or is in immediate danger, call or text 988 in the United States right away.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Substance scope</h2>
        <p className="mt-3">
          This public MVP models alcohol, cannabis, and mixed alcohol-plus-cannabis scenarios only. Kratom is not available as an active simulation mode and should only appear, if at all, as a static educational note.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">Contact</h2>
        <p className="mt-3">
          Questions about this disclaimer can be sent to <a href="mailto:david@4ourmedia.com" className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--accent)] underline-offset-4">david@4ourmedia.com</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}