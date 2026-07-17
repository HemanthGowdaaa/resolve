export const calculateLocalStreak = (reflections) => {
  if (!reflections || reflections.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Extract dates, parse as date strings, and sort ascending
  const dates = reflections
    .filter((r) => r.is_deleted === 0 || r.is_deleted === false)
    .map((r) => r.date)
    .sort();

  // Create a unique set of sorted date strings
  const uniqueDates = [...new Set(dates)];
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak
  const activeDatesSet = new Set(uniqueDates);
  const todayStr = new Date().toISOString().split("T")[0];
  
  const getYesterdayStr = (dateStr) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  let currentStreak = 0;
  let checkDateStr = "";

  if (activeDatesSet.has(todayStr)) {
    checkDateStr = todayStr;
  } else {
    const yesterdayStr = getYesterdayStr(todayStr);
    if (activeDatesSet.has(yesterdayStr)) {
      checkDateStr = yesterdayStr;
    }
  }

  if (checkDateStr) {
    while (activeDatesSet.has(checkDateStr)) {
      currentStreak += 1;
      checkDateStr = getYesterdayStr(checkDateStr);
    }
  }

  // Calculate longest streak using robust date-string checks
  let longestStreak = 0;
  let currentLen = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    const dateStr = uniqueDates[i];
    if (i === 0) {
      currentLen = 1;
    } else {
      const prevDateStr = uniqueDates[i - 1];
      if (getYesterdayStr(dateStr) === prevDateStr) {
        currentLen += 1;
      } else {
        longestStreak = Math.max(longestStreak, currentLen);
        currentLen = 1;
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, currentLen);

  return {
    currentStreak,
    longestStreak,
  };
};
export default calculateLocalStreak;
