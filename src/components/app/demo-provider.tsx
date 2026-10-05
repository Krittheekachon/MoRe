"use client";

import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { patients, initialPlan, initialSets, initialTemplates, demoDate, type PatientProfile, type PlanItem, type SavedSet, type TemplatePlan } from "@/lib/demo-data";

type DemoState = {
  profiles: PatientProfile[]; setProfiles: Dispatch<SetStateAction<PatientProfile[]>>;
  plans: Record<string, PlanItem[]>; setPlans: Dispatch<SetStateAction<Record<string, PlanItem[]>>>;
  dailyPlans: Record<string, PlanItem[]>;
  templates: TemplatePlan[]; setTemplates: Dispatch<SetStateAction<TemplatePlan[]>>;
  sets: SavedSet[]; saveSet: (set: SavedSet, target: number) => void;
  draft: Partial<PatientProfile>; setDraft: Dispatch<SetStateAction<Partial<PatientProfile>>>;
};
const DemoContext = createContext<DemoState | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState(patients);
  const [plans, setPlans] = useState<Record<string, PlanItem[]>>({ "1": initialPlan, "2": initialPlan, "3": [] });
  const [dailyPlans] = useState<Record<string, PlanItem[]>>({ "1": initialPlan, "2": initialPlan, "3": [] });
  const [templates, setTemplates] = useState(initialTemplates);
  const [sets, setSets] = useState(initialSets);
  const [draft, setDraft] = useState<Partial<PatientProfile>>({});
  function saveSet(set: SavedSet, target: number) {
    setSets(current => {
      const count = current.filter(s => s.patient_id === set.patient_id && s.exercise_id === set.exercise_id && s.local_date === demoDate).length;
      if (count >= target || current.some(s => s.id === set.id)) return current;
      return [...current, set];
    });
  }
  return <DemoContext.Provider value={{ profiles, setProfiles, plans, setPlans, dailyPlans, templates, setTemplates, sets, saveSet, draft, setDraft }}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoProvider is required");
  return context;
}
