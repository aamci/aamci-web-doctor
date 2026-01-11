'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, MapPin, User } from 'lucide-react';
import styles from './PlanningListView.module.css';
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
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
  isCopyMode?: boolean;
}

export default function PlanningListView({ slots, currentDate, onAppointmentClick, onSlotClick, isCopyMode = false }: Props) {
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
        <EmptyState type="no-slots" view="list" />
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
                {daySlots.map((slot: any) => {
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
                        <div className={styles.slotTime}>
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className={styles.timeRange}>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>
                        <div className={styles.slotDetails}>
                          <div className={styles.slotInfo}>
                            <span className="text-gray-500 text-sm">Disponible</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Style pour slots exclus
                  if (isExcluded) {
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.slotCard} ${styles.excludedSlot}`}
                        title="Période non disponible"
                      >
                        <div className={styles.slotTime}>
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className={styles.timeRange}>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>

                        <div className={styles.slotDetails}>
                          <div className={styles.slotInfo}>
                            <div className={styles.capacity}>
                              <span>Période bloquée</span>
                            </div>
                          </div>

                          <div className={styles.slotStatus}>
                            <span className={`${styles.statusBadge} bg-gray-100 text-gray-700 border-gray-300`}>
                              Indisponible
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Afficher uniquement les rendez-vous réservés
                  if (isBooked) {
                    const appointmentStatus = appointment?.status || 'PENDING';

                    // Classes selon le statut
                    const statusClasses =
                      appointmentStatus === 'CANCELLED' ? 'bg-gray-50 opacity-60' :
                      appointmentStatus === 'PENDING' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                      appointmentStatus === 'CONFIRMED' ? 'bg-green-50 border-l-4 border-green-400' :
                      '';

                    const badgeClasses =
                      appointmentStatus === 'CANCELLED' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                      appointmentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      appointmentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-300' :
                      'bg-blue-100 text-blue-700 border-blue-300';

                    const statusLabel =
                      appointmentStatus === 'CANCELLED' ? '❌ Annulé' :
                      appointmentStatus === 'PENDING' ? '⏳ En attente' :
                      appointmentStatus === 'CONFIRMED' ? '✅ Confirmé' :
                      'Réservé';

                    return (
                      <div
                        key={slot.id}
                        className={`${styles.slotCard} ${statusClasses} cursor-pointer hover:bg-gray-50 ${isCopyMode ? 'bg-yellow-50 border-2 border-yellow-300' : ''}`}
                        onClick={() => isCopyMode ? onSlotClick(slot) : onAppointmentClick({ ...appointment, start: slot.start, end: slot.end })}
                      >
                        <div className={styles.slotTime}>
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className={`${styles.timeRange} ${appointmentStatus === 'CANCELLED' ? 'line-through text-gray-400' : ''}`}>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>

                        <div className={styles.slotDetails}>
                          <div className={styles.slotInfo}>
                            {appointment?.patient && (
                              <>
                                <div className={styles.capacity}>
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className={appointmentStatus === 'CANCELLED' ? 'line-through text-gray-400' : ''}>
                                    Patient: {appointment.patient.fullName}
                                  </span>
                                </div>
                                {appointment.kind && (
                                  <div className={styles.kindBadge}>
                                    {appointment.kind.name}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className={styles.slotStatus}>
                            <span className={`${styles.statusBadge} ${badgeClasses}`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
