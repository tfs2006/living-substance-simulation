import {
  DEFAULT_INPUTS,
  type MetricSnapshot,
  type SimulationInputs,
  type SimulationScenario,
  type SimulationStep,
  type TimelineEvent,
} from "./types";

const STEP_MINUTES = 15;
const STEPS_PER_HOUR = 60 / STEP_MINUTES;

type UseEvent = {
  hour: number;
  substance: "alcohol" | "cannabis";
  amount: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function isAlcoholMode(inputs: SimulationInputs) {
  return inputs.substance === "alcohol" || inputs.substance === "both";
}

function isCannabisMode(inputs: SimulationInputs) {
  return inputs.substance === "cannabis" || inputs.substance === "both";
}

function createUseSchedule(inputs: SimulationInputs) {
  const useEvents: UseEvent[] = [];
  const centerHour = inputs.timeOfDay;
  const spacingHours = inputs.frequencyPerDay <= 1 ? 0 : 2.75;

  for (let day = 0; day < inputs.daysInRow; day += 1) {
    for (let index = 0; index < inputs.frequencyPerDay; index += 1) {
      const offset =
        inputs.frequencyPerDay <= 1
          ? 0
          : (index - (inputs.frequencyPerDay - 1) / 2) * spacingHours;
      const hour = clamp(day * 24 + centerHour + offset, day * 24, day * 24 + 23.75);

      if (isAlcoholMode(inputs)) {
        useEvents.push({
          hour,
          substance: "alcohol",
          amount: inputs.doseAmount / (isCannabisMode(inputs) ? 1.3 : 1),
        });
      }

      if (isCannabisMode(inputs)) {
        useEvents.push({
          hour,
          substance: "cannabis",
          amount: inputs.doseAmount / (isAlcoholMode(inputs) ? 1.45 : 1),
        });
      }
    }
  }

  return useEvents.sort((left, right) => left.hour - right.hour);
}

function getLoads(currentHour: number, events: UseEvent[]) {
  let alcoholLoad = 0;
  let cannabisLoad = 0;
  let recentAlcohol = 0;
  let recentCannabis = 0;

  for (const event of events) {
    const age = currentHour - event.hour;
    if (age < 0 || age > 144) {
      continue;
    }

    if (event.substance === "alcohol") {
      const acute = Math.exp(-age / 4.6) * event.amount;
      const recent = Math.exp(-age / 18) * event.amount;
      alcoholLoad += acute;
      recentAlcohol += recent;
    } else {
      const acute = Math.exp(-age / 5.4) * event.amount;
      const recent = Math.exp(-age / 22) * event.amount;
      cannabisLoad += acute;
      recentCannabis += recent;
    }
  }

  return { alcoholLoad, cannabisLoad, recentAlcohol, recentCannabis };
}

function getLastUseHour(events: UseEvent[], substance: "alcohol" | "cannabis") {
  const matching = events.filter((event) => event.substance === substance);
  if (matching.length === 0) {
    return -Infinity;
  }

  return matching[matching.length - 1].hour;
}

function formatHour(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  const roundedHour = Math.floor(normalized);
  const minutes = normalized - roundedHour >= 0.5 ? "30" : "00";
  const base = roundedHour % 12 || 12;
  const suffix = roundedHour >= 12 ? "PM" : "AM";
  return `${base}:${minutes} ${suffix}`;
}

function getFeeling(metrics: MetricSnapshot) {
  if (metrics.panicLikelihood > 72) {
    return "Feeling tight, easily startled, and hard to settle.";
  }

  if (metrics.tremorRisk > 60) {
    return "Feeling shaky, on edge, and physically unsettled.";
  }

  if (metrics.reliefLevel > 62 && metrics.reboundAnxiety < 36) {
    return "Feeling some short-term easing, but it may not hold for long.";
  }

  if (metrics.cravingLevel > 62) {
    return "Feeling pulled toward relief, even if the expected reward is thin.";
  }

  if (metrics.functionalStability > 68) {
    return "Feeling steadier and more able to stay organized.";
  }

  return "Feeling mixed, with some tension still running in the background.";
}

function getSafetySummary(metrics: MetricSnapshot, inputs: SimulationInputs) {
  if (metrics.tremorRisk > 74 && isAlcoholMode(inputs) && inputs.stoppedSuddenly) {
    return "Shakiness risk is elevated. Severe alcohol withdrawal can be dangerous and needs real medical care.";
  }

  if (metrics.panicLikelihood > 78 || metrics.emotionalVolatility > 82) {
    return "Distress is running high. If symptoms feel intense, unsafe, or confusing, real clinical support matters more than any simulation.";
  }

  if (inputs.substance === "both") {
    return "Mixing alcohol and cannabis increases uncertainty. This model becomes less reliable when both are active.";
  }

  return "This is a simplified educational model. Real symptoms vary, and severe symptoms require real care.";
}

export function explainCurrentState(step: SimulationStep, inputs: SimulationInputs) {
  const lines: string[] = [];

  if (step.reliefLevel > 58) {
    lines.push(
      "There is still some short-term relief in the system, which can make the body expect an easing that does not last.",
    );
  }

  if (step.rewardExpectation > 55 && step.cravingLevel > 55) {
    lines.push(
      "The brain is acting like a familiar payoff should arrive soon. When that expected reward does not fully arrive, craving can feel louder and more urgent.",
    );
  }

  if (step.reboundAnxiety > 52) {
    lines.push(
      "Rebound anxiety is elevated. After the calmer phase fades, the system can overshoot into tension, restlessness, and scanning for danger.",
    );
  }

  if (step.sleepDisruption > 55) {
    lines.push(
      "Sleep disruption is adding fuel here. A tired nervous system has less room for frustration, noise, and uncertainty.",
    );
  }

  if (step.tremorRisk > 48) {
    lines.push(
      "Shakiness risk is up, which can look like internal buzzing, tremor, sweating, or a sense that the body will not fully settle.",
    );
  }

  if (inputs.substance === "both") {
    lines.push(
      "Alcohol and cannabis are both in the picture, so the pattern is less predictable and the uncertainty score is intentionally higher.",
    );
  }

  if (lines.length === 0) {
    lines.push(
      "The state is relatively moderate right now. Stress, sleep, hydration, and the familiar timing of past use still shape what happens next.",
    );
  }

  return lines.join(" ");
}

export function simulateScenario(inputs: SimulationInputs = DEFAULT_INPUTS): SimulationScenario {
  const events = createUseSchedule(inputs);
  const lastAlcoholHour = getLastUseHour(events, "alcohol");
  const lastCannabisHour = getLastUseHour(events, "cannabis");
  const recoveryDays = inputs.stoppedSuddenly ? 5 : 3;
  const totalHours = (inputs.daysInRow + recoveryDays) * 24;
  const totalSteps = totalHours * STEPS_PER_HOUR;
  const timelineEvents: TimelineEvent[] = [];
  const steps: SimulationStep[] = [];
  let previousMetrics: MetricSnapshot | null = null;

  for (let step = 0; step < totalSteps; step += 1) {
    const currentHour = step / STEPS_PER_HOUR;
    const { alcoholLoad, cannabisLoad, recentAlcohol, recentCannabis } = getLoads(currentHour, events);
    const hoursSinceAlcohol = currentHour - lastAlcoholHour;
    const hoursSinceCannabis = currentHour - lastCannabisHour;
    const sleepDebt = clamp((7.5 - inputs.sleepAmount) * 12, 0, 38);
    const nutritionalStress = clamp((65 - inputs.foodHydrationQuality) * 0.7, 0, 26);
    const baselineActivation =
      inputs.baselineStress * 0.42 + inputs.baselineAnxiety * 0.48 + inputs.traumaSensitivity * 0.28;
    const cueDistance = Math.abs((((currentHour % 24) - inputs.timeOfDay + 12) % 24) - 12);
    const cueSignal = inputs.stoppedSuddenly
      ? clamp((3 - cueDistance) * 16, 0, 48)
      : clamp((2 - cueDistance) * 10, 0, 24);
    const alcoholRelief = alcoholLoad * 0.78;
    const cannabisRelief = cannabisLoad * 0.72 - inputs.traumaSensitivity * 0.06;
    const acuteRelief = alcoholRelief + Math.max(cannabisRelief, -6);
    const alcoholRebound =
      isAlcoholMode(inputs) && hoursSinceAlcohol > 3
        ? recentAlcohol * sigmoid((hoursSinceAlcohol - 6) / 4) * 0.54
        : 0;
    const cannabisAcuteAnxiety =
      isCannabisMode(inputs) && cannabisLoad > 24
        ? (inputs.baselineAnxiety * 0.12 + inputs.traumaSensitivity * 0.16) * sigmoid((cannabisLoad - 30) / 8)
        : 0;
    const cannabisPauseStress =
      isCannabisMode(inputs) && inputs.stoppedSuddenly && hoursSinceCannabis > 18
        ? recentCannabis * sigmoid((hoursSinceCannabis - 28) / 7) * 0.36
        : 0;
    const alcoholWithdrawal =
      isAlcoholMode(inputs) && inputs.stoppedSuddenly && hoursSinceAlcohol > 8
        ? recentAlcohol * sigmoid((hoursSinceAlcohol - 14) / 5) * 0.44
        : 0;
    const sleepDisruption = clamp(
      sleepDebt + alcoholLoad * 0.18 + cannabisLoad * 0.12 + alcoholWithdrawal * 0.24 + cannabisPauseStress * 0.18,
    );
    const reliefLevel = clamp(acuteRelief - baselineActivation * 0.18 + 18);
    const reboundAnxiety = clamp(
      baselineActivation * 0.5 + alcoholRebound + cannabisAcuteAnxiety + cannabisPauseStress + sleepDisruption * 0.22,
    );
    const rewardExpectation = clamp(
      acuteRelief * 0.56 + cueSignal + (recentAlcohol + recentCannabis) * 0.26 + inputs.baselineStress * 0.1,
    );
    const cravingLevel = clamp(
      rewardExpectation * 0.44 + reboundAnxiety * 0.38 + cueSignal * 0.36 - reliefLevel * 0.22,
    );
    const tremorRisk = clamp(
      alcoholWithdrawal * 0.72 + nutritionalStress + sleepDisruption * 0.18 + inputs.baselineAnxiety * 0.12,
    );
    const panicLikelihood = clamp(
      reboundAnxiety * 0.52 + cannabisAcuteAnxiety * 0.4 + sleepDisruption * 0.28 + inputs.traumaSensitivity * 0.22,
    );
    const emotionalVolatility = clamp(
      reboundAnxiety * 0.36 + cravingLevel * 0.32 + sleepDisruption * 0.2 + inputs.traumaSensitivity * 0.18,
    );
    const functionalStability = clamp(
      92 - sleepDisruption * 0.34 - panicLikelihood * 0.28 - emotionalVolatility * 0.24 - tremorRisk * 0.2,
    );
    const uncertainty = clamp(
      18 +
        (inputs.substance === "both" ? 18 : 0) +
        (inputs.stoppedSuddenly ? 10 : 0) +
        inputs.doseAmount * 0.18 +
        sleepDebt * 0.45 +
        inputs.traumaSensitivity * 0.12,
    );

    const metrics: MetricSnapshot = {
      reliefLevel,
      rewardExpectation,
      reboundAnxiety,
      cravingLevel,
      tremorRisk,
      sleepDisruption,
      panicLikelihood,
      emotionalVolatility,
      functionalStability,
      uncertainty,
    };

    const snapshot: SimulationStep = {
      step,
      day: Math.floor(currentHour / 24) + 1,
      hour: currentHour,
      label: `Day ${Math.floor(currentHour / 24) + 1}, ${formatHour(currentHour)}`,
      feelingNow: getFeeling(metrics),
      alcoholLoad: round(alcoholLoad),
      cannabisLoad: round(cannabisLoad),
      mixedUseWarning: inputs.substance === "both",
      reliefLevel: round(reliefLevel),
      rewardExpectation: round(rewardExpectation),
      reboundAnxiety: round(reboundAnxiety),
      cravingLevel: round(cravingLevel),
      tremorRisk: round(tremorRisk),
      sleepDisruption: round(sleepDisruption),
      panicLikelihood: round(panicLikelihood),
      emotionalVolatility: round(emotionalVolatility),
      functionalStability: round(functionalStability),
      uncertainty: round(uncertainty),
    };

    steps.push(snapshot);

    const prior = previousMetrics;
    if (prior) {
      if (snapshot.reliefLevel > 64 && prior.reliefLevel <= 64) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "info",
          title: "Relief spike",
          detail: "Short-term easing is prominent right now, which can teach the system to expect this state again.",
        });
      }

      if (snapshot.reboundAnxiety > 60 && prior.reboundAnxiety <= 60) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "watch",
          title: "Rebound phase",
          detail: "The calmer phase is fading and tension is overshooting upward.",
        });
      }

      if (snapshot.cravingLevel > 66 && prior.cravingLevel <= 66) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "watch",
          title: "Cue-trigger craving",
          detail: "This looks like a familiar time or condition for use, so the expected reward signal is getting louder.",
        });
      }

      if (snapshot.tremorRisk > 58 && prior.tremorRisk <= 58) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "warning",
          title: "Shakiness risk rising",
          detail: "Repeated alcohol use followed by a stop can bring more physical agitation and tremor-like symptoms.",
        });
      }

      if (snapshot.sleepDisruption > 62 && prior.sleepDisruption <= 62) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "watch",
          title: "Sleep disruption stacking up",
          detail: "Recovery sleep is being disrupted, which usually makes the next day less stable.",
        });
      }

      if (snapshot.panicLikelihood > 70 && prior.panicLikelihood <= 70) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "warning",
          title: "Panic likelihood high",
          detail: "The system looks primed for sudden fear, chest-tightening, or spiraling thoughts.",
        });
      }

      if (snapshot.functionalStability < 34 && prior.functionalStability >= 34) {
        timelineEvents.push({
          step,
          hour: currentHour,
          level: "warning",
          title: "Functioning under strain",
          detail: "Basic focus, organization, and self-regulation look more fragile in this window.",
        });
      }
    }

    previousMetrics = metrics;
  }

  const referenceStep = steps[Math.min(steps.length - 1, Math.round(steps.length * 0.55))];

  return {
    steps,
    events: timelineEvents,
    explanation: explainCurrentState(referenceStep, inputs),
    safetySummary: getSafetySummary(referenceStep, inputs),
  };
}