'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PlanningCalendar.module.css';

interface DoctorAbsence {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
  blockSlots: boolean;
  cancelAppointments: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  absences?: DoctorAbsence[];
}

export default function PlanningCalendar({ selectedDate, onDateChange, absences = [] }: Props) {
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

  const isDuringAbsence = (day: number) => {
    if (!absences || absences.length === 0 || !day) return false;

    const checkDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    checkDate.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

    for (const absence of absences) {
      if (!absence.blockSlots) continue;

      const absenceStart = new Date(absence.startDate);
      const absenceEnd = new Date(absence.endDate);

      absenceStart.setHours(0, 0, 0, 0);
      absenceEnd.setHours(23, 59, 59, 999);

      if (checkDate >= absenceStart && checkDate <= absenceEnd) {
        return true;
      }
    }

    return false;
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
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <h3 className={styles.monthTitle}>
          {selectedDate.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <button onClick={goToNextMonth} className={styles.navButton}>
          <ChevronRight className="w-3.5 h-3.5" />
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
        {monthDays.map((d, i) => {
          const isAbsence = isDuringAbsence(d.day);
          return (
            <button
              key={i}
              className={`${styles.dayCell} ${
                !d.isCurrentMonth ? styles.otherMonth : ''
              } ${isToday(d.day) ? styles.today : ''} ${
                isAbsence ? styles.absence : ''
              }`}
              onClick={() => {
                if (d.isCurrentMonth) {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(d.day);
                  onDateChange(newDate);
                }
              }}
              title={isAbsence ? 'Jour d\'absence' : ''}
            >
              {d.day || ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
