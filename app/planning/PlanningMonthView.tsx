'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './PlanningMonthView.module.css';

interface Slot {
  id: string;
  start: string;
  end: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Props {
  slots: Slot[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
}

export default function PlanningMonthView({ slots, currentDate, onDateClick }: Props) {
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() || 7; // 1 = Lundi

    const days = [];
    // Jours du mois précédent
    for (let i = 1; i < startDay; i++) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      const day = prevMonthLastDay - startDay + i + 1;
      days.push({
        day,
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
      });
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines × 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const monthDays = getMonthDays();

  // Compter les créneaux pour chaque jour
  const getSlotsForDay = (date: Date) => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.start);
      return (
        slotDate.getDate() === date.getDate() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className={styles.monthView}>
      {/* En-tête du mois */}
      <div className={styles.header}>
        <h2 className={styles.monthTitle}>
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>
      </div>

      {/* Jours de la semaine */}
      <div className={styles.weekDays}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Grille du mois */}
      <div className={styles.daysGrid}>
        {monthDays.map((d, i) => {
          const daySlots = getSlotsForDay(d.date);

          // Compter uniquement les rendez-vous réservés et les slots exclus
          const bookedSlots = daySlots.filter((s: any) =>
            s.isBooked || (s.appointments && s.appointments.length > 0 && !s.isGenerated)
          );
          const excludedSlots = daySlots.filter((s: any) =>
            s.isExcluded || s.status === 'EXCLUDED'
          );

          return (
            <button
              key={i}
              onClick={() => onDateClick?.(d.date)}
              className={`${styles.dayCell} ${
                !d.isCurrentMonth ? styles.otherMonth : ''
              } ${isToday(d.date) ? styles.today : ''} ${
                (bookedSlots.length > 0 || excludedSlots.length > 0) ? styles.hasSlots : ''
              }`}
            >
              <div className={styles.dayNumber}>{d.day}</div>

              {(bookedSlots.length > 0 || excludedSlots.length > 0) && (
                <div className={styles.slotsIndicator}>
                  {bookedSlots.length > 0 && (
                    <div className={styles.slotBadge} style={{ background: '#3b82f6' }} title={`${bookedSlots.length} rendez-vous`}>
                      {bookedSlots.length}
                    </div>
                  )}
                  {excludedSlots.length > 0 && (
                    <div className={styles.slotBadge} style={{ background: '#9ca3af' }} title={`${excludedSlots.length} périodes bloquées`}>
                      {excludedSlots.length}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendBadge} style={{ background: '#3b82f6' }}></div>
          <span>Rendez-vous réservés</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendBadge} style={{ background: '#9ca3af' }}></div>
          <span>Périodes bloquées</span>
        </div>
      </div>
    </div>
  );
}
