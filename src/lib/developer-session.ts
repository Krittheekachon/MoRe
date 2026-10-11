import "server-only";
import { accountSession } from "./account-session";
import { developerEnabled } from "./developer-policy";
import { AccountError } from "./account-validation";
export async function establishDeveloperSession() {
  if (!developerEnabled()) throw new AccountError("ไม่อนุญาตบัญชีผู้พัฒนา", 403);
  const session = await accountSession();
  delete session.userId; delete session.binding;
  session.developer = true;
  await session.save();
}
export async function requireDeveloper() {
  if (!developerEnabled() || !(await accountSession()).developer) throw new AccountError("ไม่มีสิทธิ์ผู้พัฒนา", 403);
}