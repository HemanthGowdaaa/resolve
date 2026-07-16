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

  // Calculate longest streak
  let longestStreak = 0;
  let currentLen = 0;
  let prevDate = null;

  for (const dateStr of uniqueDates) {
    const currentDate = new Date(dateStr);
    
    if (prevDate === null) {
      currentLen = 1;
    } else {
      const diffTime = Math.abs(currentDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentLen += 1;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, currentLen);
        currentLen = 1;
      }
    }
    prevDate = currentDate;
  }
  
  longestStreak = Math.max(longestStreak, currentLen);

  return {
    currentStreak,
    longestStreak,
  };
};
export default calculateLocalStreak;
