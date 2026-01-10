import styles from './PlanningListView.module.css';

export default function PlanningListViewSkeleton() {
  const slots = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className={styles.listView}>
      {/* Group header skeleton */}
      <div className={styles.dayGroup}>
        <div className={styles.dayGroupHeader}>
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Slot cards skeleton */}
        <div className={styles.slotsContainer}>
          {slots.map((slot) => (
            <div key={slot} className={`${styles.slotCard} bg-gray-50 animate-pulse`}>
              <div className={styles.slotTime}>
                <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>

              <div className={styles.slotDetails}>
                <div className={styles.slotInfo}>
                  <div className={styles.capacity}>
                    <div className="h-3 w-3 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                </div>

                <div className={styles.slotStatus}>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Second group */}
      <div className={styles.dayGroup}>
        <div className={styles.dayGroupHeader}>
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className={styles.slotsContainer}>
          {slots.slice(0, 4).map((slot) => (
            <div key={slot} className={`${styles.slotCard} bg-gray-50 animate-pulse`}>
              <div className={styles.slotTime}>
                <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>

              <div className={styles.slotDetails}>
                <div className={styles.slotInfo}>
                  <div className={styles.capacity}>
                    <div className="h-3 w-3 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                </div>

                <div className={styles.slotStatus}>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
