import type { Metadata } from "next";
import { cookies } from "next/headers";
import "@fontsource/ibm-plex-sans-thai/thai-400.css";
import "@fontsource/ibm-plex-sans-thai/thai-500.css";
import "@fontsource/ibm-plex-sans-thai/thai-600.css";
import "@fontsource/ibm-plex-sans-thai/thai-700.css";
import "@fontsource/ibm-plex-sans-thai/latin-400.css";
import "@fontsource/ibm-plex-sans-thai/latin-500.css";
import "@fontsource/ibm-plex-sans-thai/latin-600.css";
import "@fontsource/ibm-plex-sans-thai/latin-700.css";
import "./globals.css";
import "./system.css";
import { DemoProvider } from "@/components/app/demo-provider";
import { DisplaySettingsProvider } from "@/components/app/display-settings";
import { fontSizeCookie, parseFontSize, themeCookie, parseTheme } from "@/lib/display-settings";

export const metadata: Metadata = {
  title: "MoRe | ฟื้นฟูผู้ป่วย",
  description: "ระบบฟื้นฟูผู้ป่วยโรคหลอดเลือดสมอง MoRe",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const preferences = await cookies();
  const initialSize = parseFontSize(preferences.get(fontSizeCookie)?.value);
  const initialTheme = parseTheme(preferences.get(themeCookie)?.value);
  return (
    <html lang="th" data-size={initialSize} data-theme={initialTheme} className="h-full antialiased">
      <body className="min-h-full flex flex-col"><DisplaySettingsProvider initialSize={initialSize} initialTheme={initialTheme}><DemoProvider>{children}</DemoProvider></DisplaySettingsProvider></body>
    </html>
  );
}
