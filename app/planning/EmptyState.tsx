import { Calendar, Filter, Plus } from 'lucide-react';

type EmptyStateType = 'no-slots' | 'no-results' | 'no-appointments';

interface EmptyStateProps {
  type: EmptyStateType;
  view?: 'week' | 'day' | 'list' | 'month';
  onCreateSlot?: () => void;
  onClearFilters?: () => void;
}

export default function EmptyState({ type, view, onCreateSlot, onClearFilters }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'no-slots':
        return {
          icon: <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />,
          title: 'Aucune disponibilité',
          description: 'Vous n\'avez pas encore configuré de créneaux de disponibilité pour cette période.',
          action: onCreateSlot && (
            <button
              onClick={onCreateSlot}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Créer des disponibilités
            </button>
          ),
        };

      case 'no-results':
        return {
          icon: <Filter className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />,
          title: 'Aucun résultat',
          description: 'Aucun rendez-vous ne correspond aux filtres sélectionnés.',
          action: onClearFilters && (
            <button
              onClick={onClearFilters}
              className="mt-4 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              Réinitialiser les filtres
            </button>
          ),
        };

      case 'no-appointments':
        return {
          icon: <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />,
          title: 'Aucun rendez-vous',
          description: view === 'week'
            ? 'Aucun rendez-vous prévu cette semaine.'
            : view === 'day'
            ? 'Aucun rendez-vous prévu aujourd\'hui.'
            : view === 'month'
            ? 'Aucun rendez-vous prévu ce mois-ci.'
            : 'Aucun rendez-vous prévu pour cette période.',
          action: null,
        };

      default:
        return {
          icon: <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />,
          title: 'Aucune donnée',
          description: 'Aucune information à afficher pour le moment.',
          action: null,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="flex flex-col items-center text-center max-w-sm">
        {content.icon}
        <h3 className="mt-4 text-base sm:text-lg font-semibold text-gray-900">
          {content.title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          {content.description}
        </p>
        {content.action}
      </div>
    </div>
  );
}
