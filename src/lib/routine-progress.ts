type RecordedSet = { count: number; side: string | null };
/** A partial saved set is history, not a completed target set. Best N sets
 * per required side contribute; surplus never completes a second routine. */
export function routineProgress(targetSets: number, targetReps: number, side: string | null, sets: RecordedSet[]) {
  const sides = side === "both" ? ["left", "right"] : [side];
  let completedSets = 0, progressSets = 0;
  for (const required of sides) {
    const counts = sets.filter(set => required === null || required === "none" || set.side === required)
      .map(set => set.count).sort((a,b)=>b-a).slice(0,targetSets);
    completedSets += counts.filter(count=>count>=targetReps).length;
    progressSets += counts.reduce((sum,count)=>sum+Math.min(count,targetReps)/targetReps,0);
  }
  const requiredSets = targetSets * sides.length;
  return { savedSets: sets.length, completedSets, progressSets, requiredSets,
    completed: completedSets === requiredSets, percent: requiredSets ? Math.round(progressSets/requiredSets*100) : 0 };
}
