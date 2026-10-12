"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-read server business date; don't derive it from the device clock. */
export function TrainingDayRefresh({ date }: { date: string }) {
  const router = useRouter();
  useEffect(()=>{
    let current=date, busy=false, stopped=false;
    const abort=new AbortController();
    const check=async()=>{
      if(busy || document.hidden || stopped)return;
      busy=true;
      try {
        const response=await fetch("/api/patient/training/today",{cache:"no-store",signal:abort.signal});
        if(response.ok){const next=await response.json();if(!stopped && typeof next.date==="string" && next.date!==current){current=next.date;router.refresh();}}
      }catch{ /* Retry at the next poll/focus; never clear saved history. */ }
      finally{busy=false;}
    };
    const timer=setInterval(check,30000);
    document.addEventListener("visibilitychange",check);window.addEventListener("focus",check);
    void check();
    return()=>{stopped=true;abort.abort();clearInterval(timer);document.removeEventListener("visibilitychange",check);window.removeEventListener("focus",check);};
  },[date,router]);
  return null;
}
