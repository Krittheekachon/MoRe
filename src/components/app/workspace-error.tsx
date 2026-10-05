"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";
export function WorkspaceError({ retry }: { retry?: () => void }) {
  const doctor = usePathname().startsWith("/doctor");
  return <main className="system-app review-page"><h1>โหลดข้อมูลไม่สำเร็จ</h1><p role="alert">ข้อมูลที่บันทึกแล้วไม่ถูกลบ กรุณาลองใหม่</p><div className="action-row"><button className="command primary" onClick={() => retry ? retry() : window.location.reload()}><RotateCcw size={18} />ลองใหม่</button><Link className="command" href={doctor ? "/doctor" : "/patient"}>กลับหน้าหลัก</Link></div></main>;
}
