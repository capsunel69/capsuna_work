/**
 * Helper functions for calculating next occurrence dates for recurring reminders
 */

/**
 * Calculate the next occurrence date based on reminder configuration
 * @param {Object} reminder - The reminder object from the database
 * @param {Date} fromDate - The date to calculate the next occurrence from (usually current date)
 * @returns {Date|null} - The next occurrence date or null if no recurrence
 */
function calculateNextOccurrence(reminder, fromDate = new Date()) {
  if (!reminder.recurring || reminder.recurring === '') {
    return null;
  }

  const baseDate = reminder.date ? new Date(reminder.date) : new Date();
  let nextDate;

  switch (reminder.recurring) {
    case 'daily':
      nextDate = calculateNextDaily(baseDate, fromDate);
      break;
    case 'weekly':
      nextDate = calculateNextWeekly(baseDate, fromDate, reminder.recurringConfig);
      break;
    case 'monthly':
      nextDate = calculateNextMonthly(baseDate, fromDate, reminder.recurringConfig);
      break;
    default:
      nextDate = null;
  }

  return nextDate;
}

/**
 * Calculate the next daily occurrence 
 * @param {Date} baseDate - The original date of the reminder
 * @param {Date} fromDate - The date to calculate from
 * @returns {Date} - The next occurrence date
 */
function calculateNextDaily(baseDate, fromDate) {
  const nextDate = new Date(fromDate);
  
  // Keep the same time from the base date
  nextDate.setHours(baseDate.getHours());
  nextDate.setMinutes(baseDate.getMinutes());
  nextDate.setSeconds(0);
  nextDate.setMilliseconds(0);
  
  // If the time today has already passed, move to tomorrow
  if (nextDate <= fromDate) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

/**
 * Calculate the next weekly occurrence 
 * @param {Date} baseDate - The original date of the reminder
 * @param {Date} fromDate - The date to calculate from
 * @param {Object} config - The recurring configuration
 * @returns {Date} - The next occurrence date
 */
function calculateNextWeekly(baseDate, fromDate, config) {
  if (!config || !config.dayOfWeek) {
    // Default to same day of week as base date
    const dayOfWeek = baseDate.getDay();
    const nextDate = new Date(fromDate);
    
    // Keep the same time
    nextDate.setHours(baseDate.getHours());
    nextDate.setMinutes(baseDate.getMinutes());
    nextDate.setSeconds(0);
    nextDate.setMilliseconds(0);
    
    // Calculate days to add to get to the next occurrence of this day of week
    const currentDayOfWeek = nextDate.getDay();
    let daysToAdd = dayOfWeek - currentDayOfWeek;
    if (daysToAdd <= 0 || (daysToAdd === 0 && nextDate <= fromDate)) {
      daysToAdd += 7;
    }
    
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  } else {
    // Use the configured day of week
    const dayOfWeek = config.dayOfWeek;
    const nextDate = new Date(fromDate);
    
    // Set time from baseDate or config
    if (config.time) {
      const [hours, minutes] = config.time.split(':').map(Number);
      nextDate.setHours(hours);
      nextDate.setMinutes(minutes);
    } else {
      nextDate.setHours(baseDate.getHours());
      nextDate.setMinutes(baseDate.getMinutes());
    }
    nextDate.setSeconds(0);
    nextDate.setMilliseconds(0);
    
    // Calculate days to add
    const currentDayOfWeek = nextDate.getDay();
    let daysToAdd = dayOfWeek - currentDayOfWeek;
    if (daysToAdd <= 0 || (daysToAdd === 0 && nextDate <= fromDate)) {
      daysToAdd += 7;
    }
    
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  }
}

/**
 * Calculate the next monthly occurrence 
 * @param {Date} baseDate - The original date of the reminder
 * @param {Date} fromDate - The date to calculate from
 * @param {Object} config - The recurring configuration
 * @returns {Date} - The next occurrence date
 */
function calculateNextMonthly(baseDate, fromDate, config) {
  let nextDate = new Date(fromDate);
  
  // Set time
  if (config && config.time) {
    const [hours, minutes] = config.time.split(':').map(Number);
    nextDate.setHours(hours);
    nextDate.setMinutes(minutes);
  } else {
    nextDate.setHours(baseDate.getHours());
    nextDate.setMinutes(baseDate.getMinutes());
  }
  nextDate.setSeconds(0);
  nextDate.setMilliseconds(0);
  
  if (config && config.subtype === 'relativeDay' && config.weekNum && config.dayOfWeek !== undefined) {
    // Handle "nth weekday of month" (e.g. "3rd Monday")
    return calculateRelativeMonthly(nextDate, config, fromDate);
  } else {
    // Default to same day of month
    const targetDay = config && config.dayOfMonth ? config.dayOfMonth : baseDate.getDate();
    
    // Set to the target day in the current month
    nextDate.setDate(targetDay);
    
    // If that date has passed, move to next month
    if (nextDate <= fromDate) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      // Handle case where the day doesn't exist in the next month
      const maxDaysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      if (targetDay > maxDaysInMonth) {
        nextDate.setDate(maxDaysInMonth);
      } else {
        nextDate.setDate(targetDay);
      }
    }
    
    return nextDate;
  }
}

/**
 * Calculate the next occurrence for a relative monthly pattern
 * (e.g. "First Monday of the month", "Last Friday of the month")
 */
function calculateRelativeMonthly(nextDate, config, fromDate) {
  const { weekNum, dayOfWeek } = config;
  
  // Initialize to first day of current month
  nextDate.setDate(1);
  
  // If the current month's occurrence has passed, move to next month
  const currentMonthOccurrence = findRelativeDayInMonth(nextDate, weekNum, dayOfWeek);
  if (currentMonthOccurrence <= fromDate) {
    // Move to next month
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(1);
  }
  
  // Find the target day in this month
  return findRelativeDayInMonth(nextDate, weekNum, dayOfWeek);
}

/**
 * Find a specific occurrence of a day in a month (e.g. "3rd Monday", "Last Friday")
 */
function findRelativeDayInMonth(startOfMonth, weekNum, dayOfWeek) {
  const result = new Date(startOfMonth);
  result.setDate(1); // Start at beginning of month
  
  // Find the first occurrence of the target day in the month
  while (result.getDay() !== dayOfWeek) {
    result.setDate(result.getDate() + 1);
  }
  
  if (weekNum > 0) {
    // For "First", "Second", "Third", "Fourth"
    result.setDate(result.getDate() + (weekNum - 1) * 7);
  } else if (weekNum === -1) {
    // For "Last" occurrence
    // Move to the first occurrence
    const firstOccurrence = new Date(result);
    
    // Keep adding weeks until we go past the end of the month
    let nextOccurrence = new Date(firstOccurrence);
    nextOccurrence.setDate(firstOccurrence.getDate() + 7);
    
    while (nextOccurrence.getMonth() === firstOccurrence.getMonth()) {
      result.setDate(result.getDate() + 7);
      nextOccurrence.setDate(nextOccurrence.getDate() + 7);
    }
  }
  
  return result;
}

export {
  calculateNextOccurrence,
  calculateNextDaily,
  calculateNextWeekly,
  calculateNextMonthly
}; 