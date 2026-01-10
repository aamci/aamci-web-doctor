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
  isCopyMode?: boolean;
}

export default function PlanningWeekView({ slots, weekDays, hours, onAppointmentClick, onSlotClick, isCopyMode = false }: Props) {
  // Fonction pour obtenir la couleur selon le type de consultation ET le statut
  const getAppointmentColor = (kindName?: string, status?: string) => {
    // Statut annulé - toujours grisé avec rayures
    if (status === 'CANCELLED') {
      return 'bg-gray-100 border-gray-400 text-gray-500 line-through opacity-60';
    }

    // Statut en attente - bordure jaune pointillée
    if (status === 'PENDING') {
      if (!kindName) return 'bg-yellow-50 border-yellow-400 border-dashed text-yellow-700';

      const colors = [
        'bg-blue-50 border-blue-400 border-dashed text-blue-700',
        'bg-purple-50 border-purple-400 border-dashed text-purple-700',
        'bg-pink-50 border-pink-400 border-dashed text-pink-700',
        'bg-orange-50 border-orange-400 border-dashed text-orange-700',
        'bg-green-50 border-green-400 border-dashed text-green-700',
        'bg-teal-50 border-teal-400 border-dashed text-teal-700',
      ];
      const index = kindName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[index % colors.length];
    }

    // Statut confirmé - couleurs pleines normales
    if (!kindName) return 'bg-gray-100 border-gray-400 text-gray-700';

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

  // Compter les rendez-vous par jour (non annulés)
  const getAppointmentsCountForDay = (dayDate: Date) => {
    const daySlots = slots.filter((slot) => {
      const slotStart = new Date(slot.start);
      return (
        slotStart.getDate() === dayDate.getDate() &&
        slotStart.getMonth() === dayDate.getMonth() &&
        slotStart.getFullYear() === dayDate.getFullYear()
      );
    });

    // Compter uniquement les RDV non annulés
    let count = 0;
    daySlots.forEach((slot: any) => {
      if (slot.appointments && slot.appointments.length > 0) {
        slot.appointments.forEach((apt: any) => {
          if (apt.status !== 'CANCELLED') {
            count++;
          }
        });
      }
    });

    return count;
  };

  // Obtenir la couleur du badge selon la charge
  const getLoadBadgeColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-500 border-gray-200';
    if (count <= 3) return 'bg-green-100 text-green-700 border-green-300';
    if (count <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (count <= 12) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
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

          const appointmentsCount = getAppointmentsCountForDay(day.date);
          const badgeColor = getLoadBadgeColor(appointmentsCount);

          return (
            <div key={index} className={styles.dayHeader}>
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex flex-col items-start">
                  <div className={styles.dayName}>{day.day}</div>
                  <div className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>
                    {day.dayNum}
                  </div>
                </div>
                {appointmentsCount > 0 && (
                  <div
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[0.65rem] sm:text-xs font-semibold border ${badgeColor} min-w-[1.25rem] sm:min-w-[1.5rem] flex items-center justify-center`}
                    title={`${appointmentsCount} rendez-vous${appointmentsCount > 1 ? '' : ''} actif${appointmentsCount > 1 ? 's' : ''}`}
                  >
                    {appointmentsCount}
                  </div>
                )}
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
              const hasAvailableSlots = cellSlots.some((s: any) => !s.isBooked && !s.isExcluded);

              return (
                <div
                  key={dayIndex}
                  className={`${styles.dayCell} ${isCopyMode && hasAvailableSlots ? 'bg-yellow-50 border-2 border-yellow-300 cursor-copy' : ''}`}
                >
                  {cellSlots.map((slot: any) => {
                    const slotStart = new Date(slot.start);
                    const timeStr = slotStart.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const appointment = slot.appointments?.[0];
                    const isBooked = slot.isBooked || (appointment && !slot.isGenerated);
                    const isExcluded = slot.isExcluded || slot.status === 'EXCLUDED';
                    const isGenerated = slot.isGenerated && !appointment;

                    // Si c'est un temps exclu, afficher avec style grisé (sans texte)
                    if (isExcluded) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.appointment} ${styles.excludedSlot}`}
                          title="Période non disponible"
                        >
                          {/* Slot grisé vide */}
                        </div>
                      );
                    }

                    // Si c'est un slot généré vide, afficher une zone cliquable pour créer un RDV
                    if (isGenerated) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.appointment} cursor-pointer hover:bg-blue-50 transition-colors border border-dashed border-gray-300`}
                          onClick={() => onSlotClick(slot)}
                          title="Cliquez pour créer un rendez-vous"
                        >
                          <span className={styles.appointmentTime}>{timeStr}</span>
                        </div>
                      );
                    }

                    // Afficher les rendez-vous réservés avec couleur selon statut
                    if (isBooked) {
                      const kindName = appointment?.kind?.name || 'Consultation';
                      const patientName = appointment?.patient?.fullName || 'Patient';
                      const status = appointment?.status || 'PENDING';

                      return (
                        <div
                          key={slot.id}
                          className={`${styles.appointment} ${getAppointmentColor(kindName, status)} cursor-pointer hover:opacity-80 transition-all`}
                          onClick={() => onAppointmentClick({ ...appointment, start: slot.start, end: slot.end })}
                          title={`${status === 'PENDING' ? '⏳ En attente' : status === 'CONFIRMED' ? '✅ Confirmé' : status === 'CANCELLED' ? '❌ Annulé' : status} - ${kindName}`}
                        >
                          <span className={styles.appointmentTime}>{timeStr}</span>
                          <span className={styles.appointmentType}>{kindName}</span>
                          <span className={styles.appointmentPatient}>{patientName}</span>
                          {status === 'PENDING' && <span className="text-[10px] ml-1">⏳</span>}
                          {status === 'CONFIRMED' && <span className="text-[10px] ml-1">✓</span>}
                        </div>
                      );
                    }

                    return null;
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
