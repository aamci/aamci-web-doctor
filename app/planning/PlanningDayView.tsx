'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './PlanningDayView.module.css';
import EmptyState from './EmptyState';

interface Appointment {
  id: string;
  kindId?: string;
  kind?: {
    id: string;
    name: string;
  };
  patient?: {
    id: string;
    fullName?: string;
  };
}

interface Slot {
  id: string;
  start: string;
  end: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  appointments?: Appointment[];
}

interface Props {
  slots: Slot[];
  currentDate: Date;
  hours: number[];
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
  isCopyMode?: boolean;
}

export default function PlanningDayView({ slots, currentDate, hours, onAppointmentClick, onSlotClick, isCopyMode = false }: Props) {
  // Filtrer les créneaux pour la date actuelle
  const daySlots = slots.filter((slot) => {
    const slotDate = new Date(slot.start);
    return (
      slotDate.getDate() === currentDate.getDate() &&
      slotDate.getMonth() === currentDate.getMonth() &&
      slotDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Organiser les créneaux par heure
  const getSlotForHour = (hour: number) => {
    return daySlots.filter((slot) => {
      const slotHour = new Date(slot.start).getHours();
      return slotHour === hour;
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 border-green-400 text-green-700'
      : 'bg-gray-100 border-gray-400 text-gray-700';
  };

  // Vérifier si aucun slot
  if (daySlots.length === 0) {
    return (
      <div className={styles.dayView}>
        <EmptyState type="no-slots" view="day" />
      </div>
    );
  }

  return (
    <div className={styles.dayView}>
      {/* En-tête du jour */}
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          <div className={styles.dayNumber}>{format(currentDate, 'd')}</div>
          <div className={styles.dateDetails}>
            <div className={styles.dayName}>
              {format(currentDate, 'EEEE', { locale: fr })}
            </div>
            <div className={styles.monthYear}>
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </div>
          </div>
        </div>
        <div className={styles.slotCount}>
          {daySlots.length} créneau{daySlots.length > 1 ? 'x' : ''} ce jour
        </div>
      </div>

      {/* Grille horaire */}
      <div className={styles.timeGrid}>
        {hours.map((hour) => {
          const hourSlots = getSlotForHour(hour);
          const hasAvailableSlots = hourSlots.some((s: any) => !s.isBooked && !s.isExcluded);

          return (
            <div key={hour} className={styles.timeSlot}>
              {/* Colonne heure */}
              <div className={styles.hourLabel}>{hour}:00</div>

              {/* Colonne créneaux */}
              <div className={`${styles.slotContainer} ${isCopyMode && hasAvailableSlots ? 'bg-yellow-50 border-2 border-yellow-300 rounded cursor-copy' : ''}`}>
                {hourSlots.length === 0 ? (
                  <div className={styles.emptySlot}>
                    <span className="text-gray-400 text-xs">Aucun créneau</span>
                  </div>
                ) : (
                  hourSlots.map((slot: any) => {
                    const startTime = new Date(slot.start);
                    const endTime = new Date(slot.end);
                    const appointment = slot.appointments?.[0];
                    const isBooked = slot.isBooked || (appointment && !slot.isGenerated);
                    const isExcluded = slot.isExcluded || slot.status === 'EXCLUDED';
                    const isGenerated = slot.isGenerated && !appointment;

                    // Afficher les slots générés vides comme cliquables
                    if (isGenerated) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.slotCard} cursor-pointer hover:bg-blue-50 transition-colors border border-dashed border-gray-300`}
                          onClick={() => onSlotClick(slot)}
                          title="Cliquez pour créer un rendez-vous"
                        >
                          <div className={styles.slotHeader}>
                            <span className={styles.slotTime}>
                              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Style pour slots exclus (grisé sans texte)
                    if (isExcluded) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.slotCard} ${styles.excludedSlot}`}
                          title="Période non disponible"
                        >
                          {/* Slot grisé vide */}
                        </div>
                      );
                    }

                    // Afficher uniquement les rendez-vous réservés
                    if (isBooked) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.slotCard} bg-blue-50 border-blue-400 text-blue-700 cursor-pointer hover:opacity-80`}
                          onClick={() => onAppointmentClick({ ...appointment, start: slot.start, end: slot.end })}
                        >
                          <div className={styles.slotHeader}>
                            <span className={styles.slotTime}>
                              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </span>
                            <span className={styles.statusBadge}>
                              {appointment?.kind?.name || 'Rendez-vous'}
                            </span>
                          </div>
                          <div className={styles.slotBody}>
                            {appointment?.patient && (
                              <div className={styles.patientInfo}>
                                Patient: <strong>{appointment.patient.fullName}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
