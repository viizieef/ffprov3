/**
 * Computes exact flock age in weeks and days calculated dynamically from the loading/housing date.
 * 
 * Standard formula for broiler-breeder operations:
 * - Age in Days = (Reference Date - Loading Date) in days + 1 (since loading day is Day 1 of placement)
 * - Age in Weeks = floor(Age in Days / 7) + 1  (or standard 1-indexed production week)
 * 
 * @param loadingDateStr ISO or YYYY-MM-DD date string of bird loading
 * @param referenceDateStr Optional reference date (defaults to today)
 * @returns { ageWeeks: number, ageDays: number, totalDaysFromLoading: number, weekAndDayStr: string }
 */
export function calculateFlockAgeFromLoadingDate(
  loadingDateStr?: string,
  referenceDateStr?: string
): {
  ageWeeks: number;
  ageDays: number;
  totalDaysFromLoading: number;
  weekAndDayStr: string;
} {
  if (!loadingDateStr || typeof loadingDateStr !== 'string' || !loadingDateStr.trim()) {
    return {
      ageWeeks: 1,
      ageDays: 1,
      totalDaysFromLoading: 1,
      weekAndDayStr: 'Wk 1 Day 1'
    };
  }

  const loadDate = new Date(loadingDateStr);
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

  if (isNaN(loadDate.getTime()) || isNaN(refDate.getTime())) {
    return {
      ageWeeks: 1,
      ageDays: 1,
      totalDaysFromLoading: 1,
      weekAndDayStr: 'Wk 1 Day 1'
    };
  }

  // Normalize to UTC midnight to avoid DST/time zone discrepancies
  const utcLoad = Date.UTC(loadDate.getFullYear(), loadDate.getMonth(), loadDate.getDate());
  const utcRef = Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const diffMs = utcRef - utcLoad;
  if (isNaN(diffMs)) {
    return {
      ageWeeks: 1,
      ageDays: 1,
      totalDaysFromLoading: 1,
      weekAndDayStr: 'Wk 1 Day 1'
    };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // If before loading date or on loading date
  if (diffDays < 0) {
    return {
      ageWeeks: 1,
      ageDays: 1,
      totalDaysFromLoading: 0,
      weekAndDayStr: 'Pre-Placement'
    };
  }

  // Day 0 of placement is Day 1 of Week 1
  const totalDays = diffDays + 1;
  const ageWeeks = Math.max(1, Math.floor((totalDays - 1) / 7) + 1);
  const dayInWeek = Math.max(1, ((totalDays - 1) % 7) + 1);

  return {
    ageWeeks: isNaN(ageWeeks) ? 1 : ageWeeks,
    ageDays: isNaN(dayInWeek) ? 1 : dayInWeek,
    totalDaysFromLoading: isNaN(totalDays) ? 1 : totalDays,
    weekAndDayStr: `Wk ${isNaN(ageWeeks) ? 1 : ageWeeks} D${isNaN(dayInWeek) ? 1 : dayInWeek}`
  };
}
