// Existing template_code metadata; no additional persisted field or clinical criteria.
export const mockDemoTemplateCode = "DEMO-MOCK-KNEE";
export function isMockPlan(code: string | null | undefined) {
  return code?.startsWith("DEMO-MOCK-") ?? false;
}
