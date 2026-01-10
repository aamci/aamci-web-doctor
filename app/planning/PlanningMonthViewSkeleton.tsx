import styles from './PlanningMonthView.module.css';

export default function PlanningMonthViewSkeleton() {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const days = Array.from({ length: 35 }, (_, i) => i);

  return (
    <div className={styles.monthView}>
      {/* Header skeleton */}
      <div className={styles.header}>
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Week days */}
      <div className={styles.weekDays}>
        {weekDays.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Days grid skeleton */}
      <div className={styles.daysGrid}>
        {days.map((day) => (
          <div key={day} className={`${styles.dayCell} ${styles.hasSlots}`}>
            <div className={styles.dayNumber}>
              <div className="h-5 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Random badges */}
            {Math.random() > 0.6 && (
              <div className={styles.slotsIndicator}>
                <div className="h-5 w-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend skeleton */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className={styles.legendItem}>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
