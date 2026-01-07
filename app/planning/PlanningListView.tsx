'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, MapPin, User } from 'lucide-react';
import styles from './PlanningListView.module.css';

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
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
}

export default function PlanningListView({ slots, currentDate, onAppointmentClick, onSlotClick }: Props) {
  // Grouper les slots par date
  const groupedSlots = slots.reduce((acc, slot) => {
    const slotDate = new Date(slot.start);
    const dateKey = format(slotDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  // Trier les dates
  const sortedDates = Object.keys(groupedSlots).sort();

  const getStatusLabel = (status: string) => {
    return status === 'ACTIVE' ? 'Disponible' : 'Indisponible';
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className={styles.listView}>
      {sortedDates.length === 0 ? (
        <div className={styles.emptyState}>
          <p className="text-gray-500">Aucun créneau disponible</p>
        </div>
      ) : (
        sortedDates.map((dateKey) => {
          const date = new Date(dateKey);
          const daySlots = groupedSlots[dateKey].sort((a, b) =>
            new Date(a.start).getTime() - new Date(b.start).getTime()
          );

          return (
            <div key={dateKey} className={styles.dateGroup}>
              {/* En-tête de date */}
              <div className={styles.dateHeader}>
                <div className={styles.dateInfo}>
                  <div className={styles.dayNumber}>
                    {format(date, 'd', { locale: fr })}
                  </div>
                  <div className={styles.dateDetails}>
                    <div className={styles.dayName}>
                      {format(date, 'EEEE', { locale: fr })}
                    </div>
                    <div className={styles.monthYear}>
                      {format(date, 'MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
                <div className={styles.slotCount}>
                  {daySlots.length} créneau{daySlots.length > 1 ? 'x' : ''}
                </div>
              </div>

              {/* Liste des créneaux */}
              <div className={styles.slotsList}>
                {daySlots.map((slot) => {
                  const startTime = new Date(slot.start);
                  const endTime = new Date(slot.end);
                  const appointment = slot.appointments?.[0];
                  const hasAppointment = !!appointment;

                  return (
                    <div
                      key={slot.id}
                      className={`${styles.slotCard} cursor-pointer hover:bg-gray-50`}
                      onClick={() => {
                        if (hasAppointment && appointment) {
                          onAppointmentClick({ ...appointment, start: slot.start, end: slot.end });
                        } else {
                          onSlotClick(slot);
                        }
                      }}
                    >
                      <div className={styles.slotTime}>
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className={styles.timeRange}>
                          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </span>
                      </div>

                      <div className={styles.slotDetails}>
                        <div className={styles.slotInfo}>
                          {hasAppointment && appointment.patient ? (
                            <>
                              <div className={styles.capacity}>
                                <User className="w-4 h-4 text-gray-400" />
                                <span>Patient: {appointment.patient.fullName}</span>
                              </div>
                              {appointment.kind && (
                                <div className={styles.kindBadge}>
                                  {appointment.kind.name}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className={styles.capacity}>
                              <User className="w-4 h-4 text-gray-400" />
                              <span>Capacité: {slot.capacity}</span>
                            </div>
                          )}
                        </div>

                        <div className={styles.slotStatus}>
                          <span
                            className={`${styles.statusBadge} ${
                              hasAppointment
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : getStatusColor(slot.status)
                            }`}
                          >
                            {hasAppointment
                              ? 'Réservé'
                              : getStatusLabel(slot.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
