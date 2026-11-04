import type { BusinessHours, HolidayClosure, RestaurantSettings } from '../types';
import defaultSettings from '../data/settings.json';

export interface OpenNowResult {
  isOpen: boolean;
  statusText: string;     // e.g. "Open" or "Closed"
  detailText: string;     // e.g. "closes 10 PM" or "opens 11 AM tomorrow"
  fullLabel: string;      // e.g. "Open · closes 10 PM"
  isTemporaryClosed: boolean;
  isHoliday: boolean;
  currentDayName: string;
  lagosTimeFormatted: string;
}

/**
 * Gets current date & time in Africa/Lagos timezone (UTC+1, no DST).
 */
export function getLagosDateTime(baseDate: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hours: number;
  minutes: number;
  isoDateString: string; // YYYY-MM-DD
  timeMinutes: number;   // hours * 60 + minutes
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(baseDate);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hours = parseInt(partMap.hour, 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(partMap.minute, 10);

  // Weekday in Lagos
  // Format day string to 0-6 index
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = weekdayNames.indexOf(partMap.weekday);

  const isoDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeMinutes = hours * 60 + minutes;

  return {
    year,
    month,
    day,
    weekday,
    hours,
    minutes,
    isoDateString,
    timeMinutes
  };
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatMinutesTo12h(minutesTotal: number): string {
  let m = minutesTotal % 1440;
  if (m < 0) m += 1440;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return mins === 0 ? `${displayH} ${period}` : `${displayH}:${String(mins).padStart(2, '0')} ${period}`;
}

export function computeOpenNow(
  settings: Partial<RestaurantSettings> = defaultSettings as unknown as RestaurantSettings,
  nowDate: Date = new Date()
): OpenNowResult {
  const hoursList = settings.hours || (defaultSettings.hours as BusinessHours[]);
  const holidays = settings.holidays || (defaultSettings.holidays as HolidayClosure[]);
  const temporarilyClosed = !!settings.temporarily_closed;

  const lagos = getLagosDateTime(nowDate);
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = weekdayNames[lagos.weekday];
  const lagosTimeFormatted = formatMinutesTo12h(lagos.timeMinutes);

  if (temporarilyClosed) {
    return {
      isOpen: false,
      statusText: 'Closed',
      detailText: 'Temporarily closed',
      fullLabel: 'Closed · Temporarily closed',
      isTemporaryClosed: true,
      isHoliday: false,
      currentDayName,
      lagosTimeFormatted
    };
  }

  // Check holiday closure for today
  const holiday = holidays.find(h => h.date === lagos.isoDateString && h.closed);
  if (holiday) {
    return {
      isOpen: false,
      statusText: 'Closed',
      detailText: `Holiday (${holiday.label})`,
      fullLabel: `Closed · Holiday (${holiday.label})`,
      isTemporaryClosed: false,
      isHoliday: true,
      currentDayName,
      lagosTimeFormatted
    };
  }

  // Check if still open from previous day's shift that went past midnight
  const prevWeekday = (lagos.weekday + 6) % 7;
  const prevSchedule = hoursList.find(h => h.weekday === prevWeekday && !h.closed);
  if (prevSchedule) {
    const prevOpenMin = parseTimeToMinutes(prevSchedule.open);
    const prevCloseMin = parseTimeToMinutes(prevSchedule.close);
    // If prev close was after midnight (e.g. open 18:00, close 02:00 -> close < open)
    if (prevCloseMin < prevOpenMin && lagos.timeMinutes < prevCloseMin) {
      const closeLabel = formatMinutesTo12h(prevCloseMin);
      return {
        isOpen: true,
        statusText: 'Open',
        detailText: `closes ${closeLabel}`,
        fullLabel: `Open · closes ${closeLabel}`,
        isTemporaryClosed: false,
        isHoliday: false,
        currentDayName,
        lagosTimeFormatted
      };
    }
  }

  // Check today's schedule
  const todaySchedule = hoursList.find(h => h.weekday === lagos.weekday && !h.closed);
  if (todaySchedule) {
    const openMin = parseTimeToMinutes(todaySchedule.open);
    let closeMin = parseTimeToMinutes(todaySchedule.close);
    const runsPastMidnight = closeMin < openMin;

    if (runsPastMidnight) {
      if (lagos.timeMinutes >= openMin) {
        const closeLabel = formatMinutesTo12h(closeMin);
        return {
          isOpen: true,
          statusText: 'Open',
          detailText: `closes ${closeLabel}`,
          fullLabel: `Open · closes ${closeLabel}`,
          isTemporaryClosed: false,
          isHoliday: false,
          currentDayName,
          lagosTimeFormatted
        };
      }
    } else {
      if (lagos.timeMinutes >= openMin && lagos.timeMinutes < closeMin) {
        const closeLabel = formatMinutesTo12h(closeMin);
        return {
          isOpen: true,
          statusText: 'Open',
          detailText: `closes ${closeLabel}`,
          fullLabel: `Open · closes ${closeLabel}`,
          isTemporaryClosed: false,
          isHoliday: false,
          currentDayName,
          lagosTimeFormatted
        };
      }
    }

    // If today hasn't opened yet:
    if (lagos.timeMinutes < openMin) {
      const openLabel = formatMinutesTo12h(openMin);
      return {
        isOpen: false,
        statusText: 'Closed',
        detailText: `opens ${openLabel} today`,
        fullLabel: `Closed · opens ${openLabel} today`,
        isTemporaryClosed: false,
        isHoliday: false,
        currentDayName,
        lagosTimeFormatted
      };
    }
  }

  // Otherwise, find the next opening time
  for (let offset = 1; offset <= 7; offset++) {
    const nextWeekday = (lagos.weekday + offset) % 7;
    const schedule = hoursList.find(h => h.weekday === nextWeekday && !h.closed);
    if (schedule) {
      const openLabel = formatMinutesTo12h(parseTimeToMinutes(schedule.open));
      const daySuffix = offset === 1 ? 'tomorrow' : weekdayNames[nextWeekday];
      return {
        isOpen: false,
        statusText: 'Closed',
        detailText: `opens ${openLabel} ${daySuffix}`,
        fullLabel: `Closed · opens ${openLabel} ${daySuffix}`,
        isTemporaryClosed: false,
        isHoliday: false,
        currentDayName,
        lagosTimeFormatted
      };
    }
  }

  return {
    isOpen: false,
    statusText: 'Closed',
    detailText: 'Check hours',
    fullLabel: 'Closed',
    isTemporaryClosed: false,
    isHoliday: false,
    currentDayName,
    lagosTimeFormatted
  };
}

