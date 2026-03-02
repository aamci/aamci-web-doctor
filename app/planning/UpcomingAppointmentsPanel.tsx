'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { Slot } from './page';

const PER_PAGE = 3;

function statusDot(status: string) {
  if (status === 'CONFIRMED') return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />;
  if (status === 'PENDING')   return <span className="w-1.5 h-1.5 rounded-full bg-amber-400  inline-block" />;
  if (status === 'CANCELLED') return <span className="w-1.5 h-1.5 rounded-full bg-gray-300   inline-block" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />;
}

interface Props {
  allSlots: Slot[];
}

export default function UpcomingAppointmentsPanel({ allSlots }: Props) {
  const [page, setPage] = useState(0);

  const upcoming = useMemo(() => {
    const now = new Date();
    const items: Array<{ slotStart: string; slotEnd: string; apt: NonNullable<Slot['appointments']>[number] }> = [];

    for (const slot of allSlots) {
      if (!slot.appointments?.length) continue;
      for (const apt of slot.appointments) {
        if (apt.status === 'CANCELLED') continue;
        if (new Date(slot.start) <= now) continue;
        items.push({ slotStart: slot.start, slotEnd: slot.end, apt });
      }
    }

    return items.sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime());
  }, [allSlots]);

  const totalPages = Math.ceil(upcoming.length / PER_PAGE);
  const pageItems  = upcoming.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const hasPrev    = page > 0;
  const hasNext    = page < totalPages - 1;

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={13} className="text-blue-500" />
          <h4 className="text-[0.625rem] font-semibold text-gray-700 uppercase tracking-wide">
            Prochains rendez-vous
          </h4>
        </div>
        {upcoming.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium">
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, upcoming.length)}/{upcoming.length}
          </span>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {upcoming.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[11px] text-gray-400">Aucun rendez-vous à venir</p>
          </div>
        ) : (
          <>
            {pageItems.map(({ slotStart, slotEnd, apt }, i) => {
              const start    = new Date(slotStart);
              const end      = new Date(slotEnd);
              const dateStr  = format(start, 'EEE d MMM', { locale: fr });
              const timeStr  = `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
              const patient  = apt.patient?.fullName || 'Patient';
              const kindName = apt.kind?.name || 'Consultation';
              const isLast   = i === pageItems.length - 1;

              return (
                <div
                  key={apt.id}
                  className={`px-3 py-2 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-blue-50/40 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-bold text-gray-800">{timeStr}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusDot(apt.status)}
                    <span className="text-[11px] text-gray-700 font-medium truncate flex-1">{patient}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">{kindName}</div>
                </div>
              );
            })}

            {/* Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100 bg-gray-50">
                <button
                  className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                    hasPrev ? 'text-blue-600 hover:bg-blue-100 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
                  }`}
                  onClick={() => { if (hasPrev) setPage((p) => p - 1); }}
                  disabled={!hasPrev}
                >
                  <ChevronLeft size={11} />
                  Préc.
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === page ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                    hasNext ? 'text-blue-600 hover:bg-blue-100 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
                  }`}
                  onClick={() => { if (hasNext) setPage((p) => p + 1); }}
                  disabled={!hasNext}
                >
                  Suiv.
                  <ChevronRight size={11} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
