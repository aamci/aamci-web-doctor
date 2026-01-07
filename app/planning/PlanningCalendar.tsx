'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PlanningCalendar.module.css';

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function PlanningCalendar({ selectedDate, onDateChange }: Props) {
  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() || 7; // 1 = Lundi

    const days = [];
    // Jours du mois précédent
    for (let i = 1; i < startDay; i++) {
      days.push({ day: 0, isCurrentMonth: false });
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    return days;
  };

  const monthDays = getMonthDays();
  const today = new Date();

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  return (
    <div className={styles.calendar}>
      {/* Header */}
      <div className={styles.calendarHeader}>
        <button onClick={goToPreviousMonth} className={styles.navButton}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className={styles.monthTitle}>
          {selectedDate.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <button onClick={goToNextMonth} className={styles.navButton}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days of week */}
      <div className={styles.weekDays}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.daysGrid}>
        {monthDays.map((d, i) => (
          <button
            key={i}
            className={`${styles.dayCell} ${
              !d.isCurrentMonth ? styles.otherMonth : ''
            } ${isToday(d.day) ? styles.today : ''}`}
            onClick={() => {
              if (d.isCurrentMonth) {
                const newDate = new Date(selectedDate);
                newDate.setDate(d.day);
                onDateChange(newDate);
              }
            }}
          >
            {d.day || ''}
          </button>
        ))}
      </div>
    </div>
  );
}
