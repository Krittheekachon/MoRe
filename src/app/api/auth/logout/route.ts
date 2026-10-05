import { mutation } from "@/lib/account-http";
import { accountSession, registrationSession } from "@/lib/account-session";
import { onlyFields } from "@/lib/account-validation";

export async function POST(request: Request) {
  return mutation(request, async data => {
    onlyFields(data, []);
    (await accountSession()).destroy();
    (await registrationSession()).destroy();
    return { ok: true };
  });
}
