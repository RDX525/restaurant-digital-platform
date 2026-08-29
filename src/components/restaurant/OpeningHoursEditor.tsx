"use client";

import type { OpeningHours } from "@/lib/restaurant/types";
import { DAYS_ORDER, DAY_LABELS } from "@/lib/restaurant/types";
import { updateOpeningHoursDay } from "@/lib/restaurant/opening-hours";

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (hours: OpeningHours) => void;
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-pine-900/5 bg-white shadow-soft">
      {DAYS_ORDER.map((day, index) => {
        const dayHours = value[day] ?? { open: "11:30", close: "22:00", closed: true };
        return (
          <div
            key={day}
            className={`grid gap-3 px-4 py-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center ${
              index > 0 ? "border-t border-pine-900/5" : ""
            }`}
          >
            <span className="text-sm font-medium text-pine-800">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-2 text-xs text-pine-500">
              Open
              <input
                type="time"
                className="input py-1.5"
                value={dayHours.open}
                disabled={dayHours.closed}
                onChange={(e) =>
                  onChange(updateOpeningHoursDay(value, day, { open: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-pine-500">
              Close
              <input
                type="time"
                className="input py-1.5"
                value={dayHours.close}
                disabled={dayHours.closed}
                onChange={(e) =>
                  onChange(updateOpeningHoursDay(value, day, { close: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-pine-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-pine-300"
                checked={dayHours.closed}
                onChange={(e) =>
                  onChange(updateOpeningHoursDay(value, day, { closed: e.target.checked }))
                }
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}
