export const fontSizeCookie = "more-font-size";
export const themeCookie = "more-theme";
export type Theme = "system" | "light" | "dark";
export type FontSize = "m" | "l" | "xl";

export function parseFontSize(value: string | undefined): FontSize {
  return value === "l" || value === "xl" ? value : "m";
}

export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}
