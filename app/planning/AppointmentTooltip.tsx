'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, Phone, Mail, Clock, Video } from 'lucide-react';

interface AppointmentData {
  id?: string;
  status?: string;
  notes?: string;
  kind?: { name: string; isTelemedicine?: boolean };
  patient?: {
    fullName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
  };
  start?: string;
  end?: string;
}

interface Props {
  appointment: AppointmentData;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

function statusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED': return { label: 'Confirmé',   color: 'bg-emerald-100 text-emerald-700' };
    case 'PENDING':   return { label: 'En attente', color: 'bg-amber-100   text-amber-700'   };
    case 'CANCELLED': return { label: 'Annulé',     color: 'bg-gray-100    text-gray-500'    };
    case 'NO_SHOW':   return { label: 'Absent',     color: 'bg-red-100     text-red-600'     };
    default:          return { label: status,       color: 'bg-blue-100    text-blue-700'    };
  }
}

export default function AppointmentTooltip({ appointment, children, className, style, onClick }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref                   = useRef<HTMLDivElement>(null);
  const timer                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipWidth          = 240;

  const show = useCallback(() => {
    if (!ref.current) return;
    const rect       = ref.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const left       = spaceRight >= tooltipWidth + 12
      ? rect.right + 8
      : rect.left - tooltipWidth - 8;
    setPos({ top: rect.top + window.scrollY, left });
    setVisible(true);
  }, []);

  const hide       = useCallback(() => { timer.current = setTimeout(() => setVisible(false), 80); }, []);
  const cancelHide = useCallback(() => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start   = appointment.start ? new Date(appointment.start) : null;
  const end     = appointment.end   ? new Date(appointment.end)   : null;
  const timeStr = start && end ? `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}` : null;
  const dateStr = start ? format(start, 'EEEE d MMMM', { locale: fr }) : null;
  const { label, color } = statusBadge(appointment.status || 'PENDING');
  const kindName = appointment.kind?.name || 'Consultation';
  const patient  = appointment.patient;

  return (
    <>
      <div
        ref={ref}
        className={className}
        style={style}
        onClick={onClick}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>

      {visible && (
        <div
          className="fixed z-[9999] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
          style={{ top: pos.top, left: pos.left, width: tooltipWidth }}
          onMouseEnter={cancelHide}
          onMouseLeave={hide}
        >
          {/* En-tête : type + statut */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {appointment.kind?.isTelemedicine && (
                  <Video size={12} className="text-purple-500 shrink-0" />
                )}
                <span className="text-xs font-semibold text-gray-800 truncate">{kindName}</span>
                {appointment.kind?.isTelemedicine && (
                  <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full shrink-0">Visio</span>
                )}
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${color}`}>
                {label}
              </span>
            </div>
            {timeStr && (
              <div className="flex items-center gap-1 mt-1.5 text-gray-500">
                <Clock size={11} />
                <span className="text-[11px]">{timeStr}</span>
                {dateStr && (
                  <span className="text-[10px] text-gray-400 capitalize ml-1">· {dateStr}</span>
                )}
              </div>
            )}
          </div>

          {/* Corps : patient + coordonnées + notes */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User size={12} className="text-blue-600" />
              </div>
              <span className="text-xs text-gray-800 font-medium truncate">
                {patient?.fullName || 'Patient inconnu'}
              </span>
            </div>

            {patient?.phone && (
              <div className="flex items-center gap-2 text-gray-500">
                <Phone size={11} className="shrink-0" />
                <span className="text-[11px]">{patient.phone}</span>
              </div>
            )}

            {patient?.email && (
              <div className="flex items-center gap-2 text-gray-500">
                <Mail size={11} className="shrink-0" />
                <span className="text-[11px] truncate">{patient.email}</span>
              </div>
            )}

            {appointment.notes && (
              <div className="pt-1.5 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 line-clamp-2">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
