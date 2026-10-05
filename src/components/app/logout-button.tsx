"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { accountRequest } from "@/lib/account-client";

export function LogoutButton({ compact = false, destination = "/" }: { compact?: boolean; destination?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setPending(true);
    try {
      await accountRequest("/api/auth/logout", {});
      // Discard both the RSC cache and in-memory account/form state.
      window.location.replace(destination);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "กรุณาลองใหม่"); setPending(false); }
  }
  return <><button className={compact ? "icon-command" : "command"} type="button" disabled={pending} aria-label="ออกจากระบบ" title="ออกจากระบบ" onClick={logout}><LogOut size={compact ? 20 : 18} />{!compact && "ออกจากระบบ"}</button>{error && <p role="alert" className="error-text">{error}</p>}</>;
}
