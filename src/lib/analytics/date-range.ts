import {
  addDaysToDateIso,
  formatDateInTimezone,
  zonedDateTimeToUtc,
} from "@/lib/reservation/timezone";
import type { DateRangePreset } from "./constants";
import { DEFAULT_ANALYTICS_TIMEZONE } from "./constants";
import type { DateRangeBounds } from "./types";

function presetLabel(preset: DateRangePreset, startDate: string, endDate: string): string {
  switch (preset) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "custom":
      return `${startDate} to ${endDate}`;
  }
}

export function resolveDateRange(
  preset: DateRangePreset,
  timezone: string = DEFAULT_ANALYTICS_TIMEZONE,
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): DateRangeBounds {
  const today = formatDateInTimezone(now, timezone);
  let startDate = today;
  let endDate = today;

  switch (preset) {
    case "today":
      break;
    case "yesterday":
      startDate = addDaysToDateIso(today, -1);
      endDate = startDate;
      break;
    case "7d":
      startDate = addDaysToDateIso(today, -6);
      break;
    case "30d":
      startDate = addDaysToDateIso(today, -29);
      break;
    case "custom":
      startDate = customFrom ?? today;
      endDate = customTo ?? today;
      if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
      }
      break;
  }

  const startUtc = zonedDateTimeToUtc(startDate, "00:00", timezone).toISOString();
  const endUtc = zonedDateTimeToUtc(
    addDaysToDateIso(endDate, 1),
    "00:00",
    timezone,
  ).toISOString();

  return {
    preset,
    timezone,
    startDate,
    endDate,
    startUtc,
    endUtc,
    label: presetLabel(preset, startDate, endDate),
  };
}

export function isWithinRange(
  isoTimestamp: string,
  range: Pick<DateRangeBounds, "startUtc" | "endUtc">,
): boolean {
  const time = new Date(isoTimestamp).getTime();
  return time >= new Date(range.startUtc).getTime() && time < new Date(range.endUtc).getTime();
}
