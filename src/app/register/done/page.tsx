import { RegisterSummary } from "@/components/auth/register-summary";
import { redirect } from "next/navigation";
import { registrationSession } from "@/lib/account-session";
export default async function DonePage() {
  if (!(await registrationSession()).completed) redirect("/register");
  return <RegisterSummary done />;
}
