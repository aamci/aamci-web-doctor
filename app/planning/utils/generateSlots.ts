export interface AvailabilityRule {
  id: string;
  ownerId: string;
  ownerType: string;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  excludedTimes: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedSlot {
  id: string;
  start: string;
  end: string;
  capacity: number;
  status: string;
  isGenerated: boolean;
  isExcluded?: boolean;
  ruleId: string;
  ownerId: string;
  ownerType: string;
  appointments: any[];
}

/**
 * Check if a time string falls within any excluded time range
 */
function isTimeExcluded(time: string, excludedTimes: string[]): boolean {
  if (!excludedTimes || excludedTimes.length === 0) return false;

  for (const range of excludedTimes) {
    const [start, end] = range.split('-');
    if (time >= start && time < end) {
      return true;
    }
  }
  return false;
}

/**
 * Generate slots from availability rules for a specific date range
 * This is used on the frontend to show available time slots without storing them in the database
 */
export function generateSlotsFromRules(
  rules: AvailabilityRule[],
  startDate: Date,
  endDate: Date
): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];

  for (const rule of rules) {
    // Skip inactive rules
    if (rule.status !== 'ACTIVE') continue;

    // Determine the effective start date (max of viewStart and ruleStart)
    const ruleStart = new Date(rule.startDate);
    const ruleEnd = new Date(rule.endDate);

    let currentDate = new Date(Math.max(startDate.getTime(), ruleStart.getTime()));
    currentDate.setHours(0, 0, 0, 0);

    const effectiveEndDate = new Date(Math.min(endDate.getTime(), ruleEnd.getTime()));

    // Iterate through each day in the range
    while (currentDate <= effectiveEndDate) {
      // Get day of week (convert Sunday=0 to Sunday=7 for consistency)
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

      // Check if this day is in the rule's days of week
      if (rule.daysOfWeek.includes(dayOfWeek)) {
        // Generate slots for this day
        for (let hour = rule.startHour; hour < rule.endHour; hour++) {
          for (let minute = 0; minute < 60; minute += rule.slotDurationMins) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, minute, 0, 0);

            const slotEnd = new Date(slotStart.getTime() + rule.slotDurationMins * 60000);

            // Check if this time is excluded
            const excluded = isTimeExcluded(timeStr, rule.excludedTimes);

            slots.push({
              id: `rule-${rule.id}-${slotStart.toISOString()}`,
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              capacity: rule.capacity,
              status: excluded ? 'EXCLUDED' : 'ACTIVE',
              isGenerated: true,
              isExcluded: excluded,
              ruleId: rule.id,
              ownerId: rule.ownerId,
              ownerType: rule.ownerType,
              appointments: []
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return slots;
}

/**
 * Merge generated slots with booked slots
 * Booked slots take precedence over generated slots at the same time
 */
export function mergeSlotsWithBooked(
  generatedSlots: GeneratedSlot[],
  bookedSlots: any[]
): any[] {
  // Create a map of booked slot times for quick lookup
  const bookedTimes = new Set(
    bookedSlots.map(slot => new Date(slot.start).toISOString())
  );

  // Filter out generated slots that conflict with booked slots
  const filteredGenerated = generatedSlots.filter(
    slot => !bookedTimes.has(new Date(slot.start).toISOString())
  );

  // Mark booked slots as such
  const markedBooked = bookedSlots.map(slot => ({
    ...slot,
    isBooked: true,
    isGenerated: false
  }));

  // Combine and sort by start time
  return [...markedBooked, ...filteredGenerated].sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}
