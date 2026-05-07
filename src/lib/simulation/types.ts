export type SubstanceMode = "alcohol" | "cannabis" | "both";

export type SimulationInputs = {
  substance: SubstanceMode;
  doseAmount: number;
  frequencyPerDay: number;
  daysInRow: number;
  timeOfDay: number;
  sleepAmount: number;
  baselineStress: number;
  baselineAnxiety: number;
  traumaSensitivity: number;
  foodHydrationQuality: number;
  stoppedSuddenly: boolean;
};

export type MetricKey =
  | "reliefLevel"
  | "rewardExpectation"
  | "reboundAnxiety"
  | "cravingLevel"
  | "tremorRisk"
  | "sleepDisruption"
  | "panicLikelihood"
  | "emotionalVolatility"
  | "functionalStability"
  | "uncertainty";

export type MetricSnapshot = Record<MetricKey, number>;

export type TimelineEventLevel = "info" | "watch" | "warning";

export type TimelineEvent = {
  step: number;
  hour: number;
  level: TimelineEventLevel;
  title: string;
  detail: string;
};

export type SimulationStep = MetricSnapshot & {
  step: number;
  day: number;
  hour: number;
  label: string;
  feelingNow: string;
  alcoholLoad: number;
  cannabisLoad: number;
  mixedUseWarning: boolean;
};

export type SimulationScenario = {
  steps: SimulationStep[];
  events: TimelineEvent[];
  explanation: string;
  safetySummary: string;
};

export type ScenarioPreset = {
  id: string;
  name: string;
  summary: string;
  inputs: SimulationInputs;
};

export const DEFAULT_INPUTS: SimulationInputs = {
  substance: "alcohol",
  doseAmount: 58,
  frequencyPerDay: 2,
  daysInRow: 3,
  timeOfDay: 20,
  sleepAmount: 6.5,
  baselineStress: 52,
  baselineAnxiety: 47,
  traumaSensitivity: 45,
  foodHydrationQuality: 58,
  stoppedSuddenly: true,
};

export const METRIC_META: Array<{
  key: MetricKey;
  label: string;
  tone: "accent" | "warning" | "danger" | "success";
}> = [
  { key: "reliefLevel", label: "Relief level", tone: "accent" },
  { key: "rewardExpectation", label: "Reward expectation", tone: "accent" },
  { key: "reboundAnxiety", label: "Rebound anxiety", tone: "warning" },
  { key: "cravingLevel", label: "Craving level", tone: "warning" },
  { key: "tremorRisk", label: "Shakiness risk", tone: "danger" },
  { key: "sleepDisruption", label: "Sleep disruption", tone: "warning" },
  { key: "panicLikelihood", label: "Panic likelihood", tone: "danger" },
  { key: "emotionalVolatility", label: "Emotional volatility", tone: "warning" },
  { key: "functionalStability", label: "Functional stability", tone: "success" },
  { key: "uncertainty", label: "Uncertainty", tone: "accent" },
];