"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { explainCurrentState, simulateScenario } from "@/lib/simulation/engine";
import { scenarioPresets } from "@/lib/simulation/presets";
import {
  DEFAULT_INPUTS,
  METRIC_META,
  type MetricKey,
  type ScenarioPreset,
  type SimulationInputs,
  type TimelineEvent,
} from "@/lib/simulation/types";

type ThemeMode = "light" | "dark";

const chartGroups: Array<{
  title: string;
  description: string;
  keys: MetricKey[];
}> = [
  {
    title: "Relief and rebound",
    description: "Short-term easing can be followed by a later overshoot into tension.",
    keys: ["reliefLevel", "reboundAnxiety"],
  },
  {
    title: "Craving pressure",
    description: "Reward expectation can stay high even when the actual reward is fading.",
    keys: ["rewardExpectation", "cravingLevel"],
  },
  {
    title: "Sleep and panic",
    description: "Poor recovery sleep often makes fear, startle, and body tension louder.",
    keys: ["sleepDisruption", "panicLikelihood"],
  },
  {
    title: "Function and shakiness",
    description: "Repeated alcohol use followed by a stop can erode steadiness fast.",
    keys: ["functionalStability", "tremorRisk"],
  },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getStoredTheme() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem("living-substance-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return null;
}

function getThemePreference() {
  if (typeof window === "undefined") {
    return "light" as ThemeMode;
  }

  const stored = getStoredTheme();
  if (stored) {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => callback();
  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("living-substance-theme-change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("living-substance-theme-change", handleChange);
  };
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("living-substance-theme", theme);
}

function formatMetricLabel(key: MetricKey) {
  return METRIC_META.find((item) => item.key === key)?.label ?? key;
}

function formatHourLabel(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  const roundedHour = Math.floor(normalized);
  const minutes = normalized - roundedHour >= 0.5 ? "30" : "00";
  const base = roundedHour % 12 || 12;
  const suffix = roundedHour >= 12 ? "PM" : "AM";
  return `${base}:${minutes} ${suffix}`;
}

function ControlSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  helper,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  helper: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <span className="text-sm font-medium text-[color:var(--foreground)]">{label}</span>
        <span className="font-mono text-xs text-[color:var(--muted)]">{helper}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 cursor-pointer appearance-none rounded-full bg-[color:var(--accent-soft)]"
      />
    </label>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm text-[color:var(--muted)]">{label}</span>
        <span className="font-mono text-sm text-[color:var(--foreground)]">{value}</span>
      </div>
      <div className="metric-track h-2 overflow-hidden rounded-full">
        <div className="metric-fill h-full rounded-full" style={{ width: `${clamp(value)}%` }} />
      </div>
    </div>
  );
}

function MiniTrend({
  values,
  activeIndex,
  stroke,
}: {
  values: number[];
  activeIndex: number;
  stroke: string;
}) {
  const width = 320;
  const height = 120;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (clamp(value) / 100) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const activeX = (activeIndex / Math.max(values.length - 1, 1)) * width;
  const activeY = height - (clamp(values[activeIndex] ?? 0) / 100) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full overflow-visible">
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(128, 128, 128, 0.25)" strokeWidth="1" />
      <polyline fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={points} />
      <circle cx={activeX} cy={activeY} r="5" fill={stroke} />
    </svg>
  );
}

function ChartCard({
  title,
  description,
  series,
  activeIndex,
}: {
  title: string;
  description: string;
  series: Array<{ key: MetricKey; color: string; values: number[] }>;
  activeIndex: number;
}) {
  return (
    <div className="glass-panel rounded-[1.75rem] p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{description}</p>
      </div>
      <div className="grid gap-5">
        {series.map((item) => (
          <div key={item.key} className="rounded-2xl border border-[color:var(--line)] p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{formatMetricLabel(item.key)}</span>
              </div>
              <span className="font-mono text-sm">{item.values[activeIndex] ?? 0}</span>
            </div>
            <MiniTrend values={item.values} activeIndex={activeIndex} stroke={item.color} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventItem({ event, active }: { event: TimelineEvent; active: boolean }) {
  const accentByLevel = {
    info: "var(--accent)",
    watch: "var(--warning)",
    warning: "var(--danger)",
  } as const;

  return (
    <article
      className={`rounded-2xl border p-4 transition-all ${
        active ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : "border-[color:var(--line)]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentByLevel[event.level] }} />
          <h4 className="text-sm font-semibold">{event.title}</h4>
        </div>
        <span className="font-mono text-xs text-[color:var(--muted)]">{formatHourLabel(event.hour)}</span>
      </div>
      <p className="text-sm leading-6 text-[color:var(--muted)]">{event.detail}</p>
    </article>
  );
}

export function SimulationApp() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [activePreset, setActivePreset] = useState<string>("custom");
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    getThemePreference,
    () => "light" as ThemeMode,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const scenario = simulateScenario(inputs);
  const currentStep = scenario.steps[activeStep] ?? scenario.steps[0];
  const explanation = explainCurrentState(currentStep, inputs);
  const nearbyEvents = scenario.events.filter(
    (event) => Math.abs(event.step - activeStep) <= 26 || event.step <= activeStep,
  );
  const eventFeed = nearbyEvents.slice(-8).reverse();

  useEffect(() => {
    if (!playing) {
      return;
    }

    const id = window.setInterval(() => {
      setActiveStep((current) => (current + 1 >= scenario.steps.length ? 0 : current + 1));
    }, 360);

    return () => window.clearInterval(id);
  }, [playing, scenario.steps.length]);

  function patchInputs(partial: Partial<SimulationInputs>) {
    setInputs((current) => ({ ...current, ...partial }));
    setActivePreset("custom");
    setActiveStep(0);
  }

  function applyPreset(preset: ScenarioPreset) {
    setInputs(preset.inputs);
    setActivePreset(preset.id);
    setActiveStep(0);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("living-substance-theme", next);
    window.dispatchEvent(new Event("living-substance-theme-change"));
  }

  const seriesPalette = ["var(--accent)", "var(--danger)", "var(--warning)", "var(--success)"];

  return (
    <main className="animate-fade mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 py-4 text-[color:var(--foreground)] sm:px-6 lg:px-8 lg:py-6">
      <section className="glass-panel-strong animate-rise overflow-hidden rounded-[2rem] px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              Educational, fictional nervous system dashboard
            </p>
            <h1 className="section-title max-w-4xl text-5xl leading-[0.92] font-medium tracking-tight md:text-7xl">
              Living Substance Simulation
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--muted)] md:text-lg">
              A rule-based visual model of how a fictional person&apos;s relief, craving, rebound anxiety,
              sleep, shakiness risk, and day-to-day stability may shift over time under alcohol use,
              cannabis use, or both.
            </p>
          </div>
          <div className="grid max-w-xl gap-3 text-sm leading-6 text-[color:var(--muted)]">
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--background-soft)] p-4">
              Educational only. This is not medical advice, not diagnosis, and not a prediction about any real person.
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--background-soft)] p-4">
              No real patient data is used here. The model is intentionally simplified and carries visible uncertainty.
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[color:var(--line)] pt-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Severe withdrawal symptoms, confusion, seizures, chest pain, or a feeling that someone may not be safe need real medical care now.
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold no-underline transition-transform hover:-translate-y-0.5"
              style={{ color: "var(--background)" }}
            >
              Open simulator
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </section>

      <section id="dashboard" className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-5 xl:h-fit">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">Simulator dashboard</p>
              <h2 className="section-title mt-2 text-3xl">Build a scenario</h2>
            </div>
            <span className="rounded-full border border-[color:var(--line)] px-3 py-1 font-mono text-xs text-[color:var(--muted)]">
              15 min steps
            </span>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">Substance</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "alcohol", label: "Alcohol" },
                  { value: "cannabis", label: "Cannabis" },
                  { value: "both", label: "Both" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patchInputs({ substance: option.value as SimulationInputs["substance"] })}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      inputs.substance === option.value
                        ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                        : "border border-[color:var(--line)] text-[color:var(--muted)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <ControlSlider
              label="Dose amount"
              value={inputs.doseAmount}
              onChange={(value) => patchInputs({ doseAmount: value })}
              min={10}
              max={100}
              helper={`${inputs.doseAmount}/100 intensity`}
            />
            <ControlSlider
              label="Frequency"
              value={inputs.frequencyPerDay}
              onChange={(value) => patchInputs({ frequencyPerDay: value })}
              min={1}
              max={4}
              helper={`${inputs.frequencyPerDay} times a day`}
            />
            <ControlSlider
              label="Days in a row"
              value={inputs.daysInRow}
              onChange={(value) => patchInputs({ daysInRow: value })}
              min={1}
              max={10}
              helper={`${inputs.daysInRow} consecutive days`}
            />
            <ControlSlider
              label="Typical use time"
              value={inputs.timeOfDay}
              onChange={(value) => patchInputs({ timeOfDay: value })}
              min={0}
              max={23}
              helper={formatHourLabel(inputs.timeOfDay)}
            />
            <ControlSlider
              label="Sleep amount"
              value={inputs.sleepAmount}
              onChange={(value) => patchInputs({ sleepAmount: value })}
              min={3.5}
              max={9}
              step={0.1}
              helper={`${inputs.sleepAmount.toFixed(1)} hours`}
            />
            <ControlSlider
              label="Baseline stress"
              value={inputs.baselineStress}
              onChange={(value) => patchInputs({ baselineStress: value })}
              min={10}
              max={90}
              helper={`${inputs.baselineStress}/100`}
            />
            <ControlSlider
              label="Baseline anxiety"
              value={inputs.baselineAnxiety}
              onChange={(value) => patchInputs({ baselineAnxiety: value })}
              min={10}
              max={90}
              helper={`${inputs.baselineAnxiety}/100`}
            />
            <ControlSlider
              label="Trauma sensitivity"
              value={inputs.traumaSensitivity}
              onChange={(value) => patchInputs({ traumaSensitivity: value })}
              min={0}
              max={100}
              helper={`${inputs.traumaSensitivity}/100`}
            />
            <ControlSlider
              label="Food and hydration"
              value={inputs.foodHydrationQuality}
              onChange={(value) => patchInputs({ foodHydrationQuality: value })}
              min={20}
              max={100}
              helper={`${inputs.foodHydrationQuality}/100 quality`}
            />

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] px-4 py-4">
              <div>
                <div className="text-sm font-medium">Stopped suddenly</div>
                <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">Turns on rebound and withdrawal-like patterns after the last use window.</p>
              </div>
              <button
                type="button"
                onClick={() => patchInputs({ stoppedSuddenly: !inputs.stoppedSuddenly })}
                className={`relative h-7 w-[3.25rem] rounded-full transition-colors ${
                  inputs.stoppedSuddenly ? "bg-[color:var(--accent)]" : "bg-[color:var(--line)]"
                }`}
                aria-pressed={inputs.stoppedSuddenly}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                    inputs.stoppedSuddenly ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </aside>

        <div className="grid gap-6">
          <section className="glass-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">Current frame</p>
                <h2 className="section-title mt-2 text-3xl">The dashboard stays live as time moves</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
                  This is a fictional person. The model does not tell you what will happen in real life. It shows one plausible pattern built from simple rules, not hidden medical precision.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPlaying((current) => !current)}
                  className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-[color:var(--background)]"
                >
                  {playing ? "Pause timeline" : "Play timeline"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputs(DEFAULT_INPUTS);
                    setActivePreset("custom");
                    setActiveStep(0);
                  }}
                  className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold"
                >
                  Reset inputs
                </button>
              </div>
            </div>

            {inputs.substance === "both" ? (
              <div className="mt-5 rounded-[1.5rem] border border-[color:var(--warning)] bg-[color:var(--accent-soft)] p-4 text-sm leading-7 text-[color:var(--foreground)]">
                Mixed alcohol and cannabis patterns are marked as more uncertain. The model intentionally raises warning language and the uncertainty score when both are active.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--background-soft)] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Simulated moment</div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">{currentStep.label}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{currentStep.feelingNow}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--background-soft)] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Relief level</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight">{currentStep.reliefLevel}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Short-term easing, disinhibition, or loosening.</p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--background-soft)] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Craving level</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight">{currentStep.cravingLevel}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Pull toward relief and familiar reward timing.</p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--background-soft)] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Functional stability</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight">{currentStep.functionalStability}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Capacity for focus, sleep, routine, and emotional steadiness.</p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--background-soft)] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Uncertainty score</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight">{currentStep.uncertainty}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Higher means the model is less confident and more variable by design.</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Timeline scrubber</div>
                  <div className="mt-2 text-lg font-semibold">{currentStep.label}</div>
                </div>
                <div className="font-mono text-sm text-[color:var(--muted)]">step {activeStep + 1} of {scenario.steps.length}</div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(scenario.steps.length - 1, 0)}
                value={activeStep}
                onChange={(event) => {
                  setPlaying(false);
                  setActiveStep(Number(event.target.value));
                }}
                className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--accent-soft)]"
              />
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6 xl:grid-cols-2">
              {chartGroups.map((group, groupIndex) => (
                <ChartCard
                  key={group.title}
                  title={group.title}
                  description={group.description}
                  activeIndex={activeStep}
                  series={group.keys.map((key, index) => ({
                    key,
                    color: seriesPalette[(groupIndex + index) % seriesPalette.length],
                    values: scenario.steps.map((step) => step[key]),
                  }))}
                />
              ))}
            </div>

            <div className="grid gap-6">
              <section className="glass-panel rounded-[2rem] p-5 md:p-6">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">Current state cards</p>
                  <h3 className="section-title mt-2 text-3xl">Nervous system snapshot</h3>
                </div>
                <div className="grid gap-4">
                  {METRIC_META.map((item) => (
                    <MetricBar key={item.key} label={item.label} value={currentStep[item.key]} />
                  ))}
                </div>
              </section>

              <section className="glass-panel rounded-[2rem] p-5 md:p-6">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">Symptom feed</p>
                  <h3 className="section-title mt-2 text-3xl">Event log</h3>
                </div>
                <div className="grid gap-3">
                  {eventFeed.length > 0 ? (
                    eventFeed.map((event) => <EventItem key={`${event.step}-${event.title}`} event={event} active={Math.abs(event.step - activeStep) <= 6} />)
                  ) : (
                    <p className="rounded-2xl border border-[color:var(--line)] p-4 text-sm leading-6 text-[color:var(--muted)]">
                      The feed fills when the model crosses notable thresholds such as rebound anxiety, rising shakiness risk, cue-trigger craving, and sleep disruption.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="glass-panel rounded-[2rem] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">Scenario presets</p>
          <h2 className="section-title mt-2 text-3xl">Start from familiar patterns</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {scenarioPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-[1.5rem] border p-5 text-left transition-all hover:-translate-y-0.5 ${
                  activePreset === preset.id
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                    : "border-[color:var(--line)]"
                }`}
              >
                <div className="text-lg font-semibold tracking-tight">{preset.name}</div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{preset.summary}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">What may be happening</p>
          <h2 className="section-title mt-2 text-3xl">Plain-language explainer</h2>
          <p className="mt-5 text-base leading-8 text-[color:var(--muted)]">{explanation}</p>
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] p-4 text-sm leading-7 text-[color:var(--muted)]">
            What the person may be feeling right now: {currentStep.feelingNow}
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-[color:var(--line)] p-4 text-sm leading-7 text-[color:var(--muted)]">
            Safety note: {scenario.safetySummary}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-[2rem] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">Safety section</p>
          <h2 className="section-title mt-2 text-3xl">Warning signs that need real help</h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-[color:var(--muted)]">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] p-4">
              Severe shaking, seizures, confusion, hallucinations, fainting, chest pain, or trouble staying awake need real medical care now.
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] p-4">
              If someone may harm themselves or feels in immediate danger, call or text 988 in the United States right away.
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] p-4">
              SAMHSA National Helpline: 1-800-662-HELP (4357). This app is never a substitute for emergency or clinical care.
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">About the model</p>
          <h2 className="section-title mt-2 text-3xl">Transparent limits</h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-[color:var(--muted)]">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] p-4">
              This MVP is a rule-based simulation. It is designed to explain patterns, not to estimate real biology with precision.
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] p-4">
              The uncertainty score rises when use is heavier, sleep is low, stress sensitivity is high, or alcohol and cannabis are combined.
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] p-4">
              Kratom is not simulated here. If it is discussed later, it should only appear as a static educational note, not an active mode.
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}