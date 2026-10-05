"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { PageHeading } from "./shell";

export function TrainingFailure({ message, title = "แผนการฝึก", back = "/patient/exercises" }: { message: string; title?: string; back?: string }) {
  const router = useRouter();
  return <><PageHeading title={title} /><p className="error-text" role="alert">{message}</p><div className="action-row"><button className="command" onClick={() => router.refresh()}><RotateCcw size={18} />ลองใหม่</button><Link className="command" href={back}>กลับ</Link></div></>;
}
