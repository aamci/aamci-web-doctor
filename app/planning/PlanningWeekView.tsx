'use client';

import { Slot } from './page';
import styles from './PlanningWeekView.module.css';

interface WeekDay {
  date: Date;
  day: string;
  dayNum: number;
}

interface Props {
  slots: Slot[];
  weekDays: WeekDay[];
  hours: number[];
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
}

export default function PlanningWeekView({ slots, weekDays, hours, onAppointmentClick, onSlotClick }: Props) {
  // Fonction pour obtenir la couleur selon le type de consultation
  const getAppointmentColor = (kindName?: string) => {
    if (!kindName) return 'bg-gray-100 border-gray-400 text-gray-700';

    // Générer une couleur basée sur le nom
    const colors = [
      'bg-blue-100 border-blue-400 text-blue-700',
      'bg-purple-100 border-purple-400 text-purple-700',
      'bg-pink-100 border-pink-400 text-pink-700',
      'bg-orange-100 border-orange-400 text-orange-700',
      'bg-green-100 border-green-400 text-green-700',
      'bg-teal-100 border-teal-400 text-teal-700',
    ];

    const index = kindName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Obtenir les slots pour une cellule spécifique (jour + heure)
  const getSlotsForCell = (dayDate: Date, hour: number) => {
    return slots.filter((slot) => {
      const slotStart = new Date(slot.start);
      const slotHour = slotStart.getHours();

      // Vérifier que c'est le même jour et la même heure
      return (
        slotStart.getDate() === dayDate.getDate() &&
        slotStart.getMonth() === dayDate.getMonth() &&
        slotStart.getFullYear() === dayDate.getFullYear() &&
        slotHour === hour
      );
    });
  };

  const today = new Date();

  return (
    <div className={styles.weekView}>
      {/* Header avec jours */}
      <div className={styles.header}>
        <div className={styles.timeColumn}></div>
        {weekDays.map((day, index) => {
          const isToday =
            day.date.getDate() === today.getDate() &&
            day.date.getMonth() === today.getMonth() &&
            day.date.getFullYear() === today.getFullYear();

          return (
            <div key={index} className={styles.dayHeader}>
              <div className={styles.dayName}>{day.day}</div>
              <div className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>
                {day.dayNum}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille horaires */}
      <div className={styles.grid}>
        {hours.map((hour) => (
          <div key={hour} className={styles.row}>
            {/* Colonne heure */}
            <div className={styles.hourCell}>{hour}:00</div>

            {/* Colonnes jours */}
            {weekDays.map((day, dayIndex) => {
              const cellSlots = getSlotsForCell(day.date, hour);

              return (
                <div key={dayIndex} className={styles.dayCell}>
                  {cellSlots.map((slot) => {
                    const slotStart = new Date(slot.start);
                    const timeStr = slotStart.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Afficher soit le type de consultation, soit "Disponible"
                    const appointment = slot.appointments?.[0];
                    const kindName = appointment?.kind?.name || 'Disponible';
                    const isAvailable = !appointment;

                    return (
                      <div
                        key={slot.id}
                        className={`${styles.appointment} ${
                          isAvailable
                            ? 'bg-green-50 border-green-300 text-green-700'
                            : getAppointmentColor(kindName)
                        } cursor-pointer hover:opacity-80`}
                        onClick={() => {
                          if (isAvailable) {
                            onSlotClick(slot);
                          } else if (appointment) {
                            onAppointmentClick({ ...appointment, start: slot.start, end: slot.end });
                          }
                        }}
                      >
                        <span className={styles.appointmentTime}>{timeStr}</span>
                        <span className={styles.appointmentType}>{kindName}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
