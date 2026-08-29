import type { DayOfWeek, OpeningHours, OpeningHoursDay } from "./types";
import { DAYS_ORDER } from "./types";

export function createDefaultOpeningHours(): OpeningHours {
  return DAYS_ORDER.reduce<OpeningHours>((acc, day) => {
    acc[day] = { open: "11:30", close: "22:00", closed: false };
    return acc;
  }, {});
}

export function normalizeOpeningHours(hours: OpeningHours | null | undefined): OpeningHours {
  if (!hours || Object.keys(hours).length === 0) {
    return createDefaultOpeningHours();
  }
  return DAYS_ORDER.reduce<OpeningHours>((acc, day) => {
    acc[day] = hours[day] ?? { open: "11:30", close: "22:00", closed: true };
    return acc;
  }, {});
}

export function updateOpeningHoursDay(
  hours: OpeningHours,
  day: DayOfWeek,
  patch: Partial<OpeningHoursDay>,
): OpeningHours {
  return {
    ...hours,
    [day]: {
      ...(hours[day] ?? { open: "11:30", close: "22:00", closed: false }),
      ...patch,
    },
  };
}
