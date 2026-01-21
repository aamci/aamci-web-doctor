import styles from './PlanningWeekView.module.css';

// Deterministic pattern for skeleton appointments to avoid hydration mismatch
const SKELETON_PATTERN = [
  [9, 14],      // Monday: 9h, 14h
  [10, 16],     // Tuesday: 10h, 16h
  [11],         // Wednesday: 11h
  [9, 11, 15],  // Thursday: 9h, 11h, 15h
  [14],         // Friday: 14h
  [],           // Saturday: none
  [],           // Sunday: none
];

export default function PlanningWeekViewSkeleton() {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h-20h
  const weekDays = Array.from({ length: 7 }, (_, i) => i);

  const shouldShowSkeleton = (day: number, hour: number) => {
    return SKELETON_PATTERN[day]?.includes(hour) ?? false;
  };

  return (
    <div className={styles.weekView}>
      {/* Header skeleton */}
      <div className={styles.weekHeader}>
        <div className={styles.timeColumn}></div>
        {weekDays.map((day) => (
          <div key={day} className={styles.dayHeader}>
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex flex-col items-start gap-1">
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-5 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className={styles.weekGrid}>
        <div className={styles.timeColumn}>
          {hours.map((hour) => (
            <div key={hour} className={styles.hourLabel}>
              <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {weekDays.map((day) => (
          <div key={day} className={styles.dayColumn}>
            {hours.map((hour) => (
              <div key={hour} className={styles.hourCell}>
                {/* Deterministic appointment-like skeletons */}
                {shouldShowSkeleton(day, hour) && (
                  <div className="absolute inset-0 m-1 bg-gray-200 rounded-lg animate-pulse p-2 flex flex-col gap-1">
                    <div className="h-3 w-12 bg-gray-300 rounded"></div>
                    <div className="h-3 w-20 bg-gray-300 rounded"></div>
                    <div className="h-3 w-16 bg-gray-300 rounded"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
