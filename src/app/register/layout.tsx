import type { ReactNode } from "react";
import { DisplayMenu } from "@/components/app/display-settings";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <><div className="register-display-toolbar"><DisplayMenu /></div>{children}</>;
}
