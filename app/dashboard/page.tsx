'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// Types
interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  patientName: string;
  type: 'DISPO' | 'PHARMACIEN' | 'CHIRURGIOPHOBE' | 'GARABA' | 'DEVIS';
  status: string;
}

interface WeekDay {
  date: Date;
  day: string;
  dayNum: number;
}

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'list' | 'day' | 'week' | 'month'>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Générer la semaine actuelle
  const getWeekDays = (date: Date): WeekDay[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        date: d,
        day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
        dayNum: d.getDate(),
      };
    });
  };

  const weekDays = getWeekDays(currentDate);

  // Générer les heures (8h - 18h)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  // Navigation semaine
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Calendrier mensuel
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

  // Couleurs par type de rendez-vous
  const getAppointmentColor = (type: string) => {
    const colors: Record<string, string> = {
      DISPO: 'bg-blue-100 border-blue-400 text-blue-700',
      PHARMACIEN: 'bg-purple-100 border-purple-400 text-purple-700',
      CHIRURGIOPHOBE: 'bg-pink-100 border-pink-400 text-pink-700',
      GARABA: 'bg-orange-100 border-orange-400 text-orange-700',
      DEVIS: 'bg-green-100 border-green-400 text-green-700',
    };
    return colors[type] || 'bg-gray-100 border-gray-400 text-gray-700';
  };

  // Mock data (à remplacer par API)
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      { id: '1', startTime: '09:00', endTime: '09:30', patientName: 'DISPO', type: 'DISPO', status: 'available' },
      { id: '2', startTime: '10:00', endTime: '10:30', patientName: 'DEVIS', type: 'DEVIS', status: 'confirmed' },
      { id: '3', startTime: '14:00', endTime: '14:30', patientName: 'GARABA', type: 'GARABA', status: 'confirmed' },
      { id: '4', startTime: '15:00', endTime: '15:30', patientName: 'CHIRURGIOPHOBE', type: 'CHIRURGIOPHOBE', status: 'confirmed' },
    ];
    setAppointments(mockAppointments);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Gauche - Calendrier Mensuel */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        {/* Bouton Nouveau RDV */}
        <button className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 mb-6 font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Nouveau rendez-vous
        </button>

        {/* Mini Calendrier */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setMonth(d.getMonth() - 1);
              setSelectedDate(d);
            }}>
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setMonth(d.getMonth() + 1);
              setSelectedDate(d);
            }}>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d, i) => (
              <button
                key={i}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg
                  ${!d.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${d.day === new Date().getDate() && d.isCurrentMonth ? 'bg-teal-600 text-white font-bold' : 'hover:bg-gray-100'}
                `}
              >
                {d.day || ''}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">SÉANCES</h4>
            {/* Liste séances */}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">TYPES DE CONSULTATION</h4>
            {/* Liste types */}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">AGENDAS</h4>
            {/* Liste agendas */}
          </div>
        </div>
      </div>

      {/* Contenu Principal - Planning */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation Date */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Aujourd'hui</h2>
              <div className="flex items-center gap-2">
                <button onClick={goToPreviousWeek} className="p-2 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600 min-w-[200px] text-center">
                  {weekDays[0].dayNum} - {weekDays[6].dayNum} {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={goToNextWeek} className="p-2 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Onglets Vue */}
            <div className="flex items-center gap-2">
              {['Liste', 'Journée', 'Semaine', 'Mois', 'Affichage'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    tab === 'Semaine'
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grille Planning */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[1000px]">
            {/* Header Jours */}
            <div className="grid grid-cols-8 bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="p-4 border-r border-gray-200"></div>
              {weekDays.map((day) => (
                <div key={day.dayNum} className="p-4 text-center border-r border-gray-200">
                  <div className="text-sm font-medium text-gray-500">{day.day}</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    day.date.toDateString() === new Date().toDateString()
                      ? 'text-teal-600'
                      : 'text-gray-800'
                  }`}>
                    {day.dayNum}
                  </div>
                </div>
              ))}
            </div>

            {/* Grille Horaires */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                {/* Colonne Heure */}
                <div className="p-2 text-right text-sm text-gray-500 border-r border-gray-200">
                  {hour}:00
                </div>

                {/* Colonnes Jours */}
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="border-r border-gray-200 p-2 min-h-[60px] hover:bg-gray-50 cursor-pointer relative"
                  >
                    {/* Rendez-vous simulés pour demo */}
                    {dayIndex === 1 && hour === 9 && (
                      <div className={`${getAppointmentColor('DISPO')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:00 DISPO</div>
                      </div>
                    )}
                    {dayIndex === 2 && hour === 10 && (
                      <div className={`${getAppointmentColor('DEVIS')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:00 DEVIS</div>
                      </div>
                    )}
                    {dayIndex === 3 && hour === 9 && (
                      <div className={`${getAppointmentColor('PHARMACIEN')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:00 PHARMACIEN</div>
                      </div>
                    )}
                    {dayIndex === 3 && hour === 10 && (
                      <div className={`${getAppointmentColor('CHIRURGIOPHOBE')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:30 CHIRURGIOPHOBE</div>
                      </div>
                    )}
                    {dayIndex === 4 && hour === 9 && (
                      <div className={`${getAppointmentColor('DISPO')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:00 DISPO</div>
                      </div>
                    )}
                    {dayIndex === 5 && hour === 9 && (
                      <div className={`${getAppointmentColor('GARABA')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:00 GARABA</div>
                      </div>
                    )}
                    {dayIndex === 4 && hour === 10 && (
                      <div className={`${getAppointmentColor('GARABA')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:30 GARABA</div>
                      </div>
                    )}
                    {dayIndex === 5 && hour === 10 && (
                      <div className={`${getAppointmentColor('CHIRURGIOPHOBE')} border-l-4 rounded p-2 text-xs mb-1`}>
                        <div className="font-semibold">09:30 CHIRURGIOPHOBE</div>
                      </div>
                    )}
                    {dayIndex === 1 && hour === 14 && (
                      <div className={`${getAppointmentColor('GARABA')} border-l-4 rounded p-2 text-xs`}>
                        <div className="font-semibold">14:00 GARABA</div>
                      </div>
                    )}
                    {dayIndex === 3 && hour === 14 && (
                      <div className={`${getAppointmentColor('PHARMACIEN')} border-l-4 rounded p-2 text-xs`}>
                        <div className="font-semibold">14:00 PHARMACIEN</div>
                      </div>
                    )}
                    {dayIndex === 4 && hour === 14 && (
                      <div className={`${getAppointmentColor('DISPO')} border-l-4 rounded p-2 text-xs`}>
                        <div className="font-semibold">14:00 DISPO</div>
                      </div>
                    )}
                    {dayIndex === 5 && hour === 14 && (
                      <div className={`${getAppointmentColor('GARABA')} border-l-4 rounded p-2 text-xs`}>
                        <div className="font-semibold">14:00 GARABA</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
