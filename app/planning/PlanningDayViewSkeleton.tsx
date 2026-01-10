import styles from './PlanningDayView.module.css';

export default function PlanningDayViewSkeleton() {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h-20h

  return (
    <div className={styles.dayView}>
      {/* Header skeleton */}
      <div className={styles.dayHeader}>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Timeline skeleton */}
      <div className={styles.timeline}>
        {hours.map((hour) => (
          <div key={hour} className={styles.timeSlot}>
            <div className={styles.timeLabel}>
              <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className={styles.slotContent}>
              {/* Random appointment-like skeletons */}
              {Math.random() > 0.6 && (
                <div className="w-full h-20 bg-gray-200 rounded-lg animate-pulse p-3 flex flex-col gap-2">
                  <div className="h-3 w-16 bg-gray-300 rounded"></div>
                  <div className="h-4 w-32 bg-gray-300 rounded"></div>
                  <div className="h-3 w-24 bg-gray-300 rounded"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
