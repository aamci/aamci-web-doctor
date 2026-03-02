'use client';

import { ChevronDown, Search, Check } from 'lucide-react';
import { useState } from 'react';
import styles from './PlanningFilters.module.css';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface PlanningFiltersProps {
  motifs: FilterOption[];
  agendas: FilterOption[];
  statuses: FilterOption[];
  selectedMotifs: string[];
  selectedAgendas: string[];
  selectedStatuses: string[];
  onMotifChange: (values: string[]) => void;
  onAgendaChange: (values: string[]) => void;
  onStatusChange: (values: string[]) => void;
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function buttonLabel(options: FilterOption[], selected: string[], allLabel: string): string {
  if (selected.length === 0) return allLabel;
  if (selected.length === 1) return options.find((o) => o.value === selected[0])?.label ?? allLabel;
  return `${selected.length} sélectionnés`;
}

export default function PlanningFilters({
  motifs, agendas, statuses,
  selectedMotifs, selectedAgendas, selectedStatuses,
  onMotifChange, onAgendaChange, onStatusChange,
}: PlanningFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchMotif, setSearchMotif]   = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  const toggleDropdown = (name: string) => {
    const isOpening = openDropdown !== name;
    setOpenDropdown(isOpening ? name : null);
    if (isOpening) { setSearchMotif(''); setSearchStatus(''); }
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
    setSearchMotif('');
    setSearchStatus('');
  };

  const filteredMotifs   = motifs.filter((m) => m.label.toLowerCase().includes(searchMotif.toLowerCase()));
  const filteredStatuses = statuses.filter((s) => s.label.toLowerCase().includes(searchStatus.toLowerCase()));

  return (
    <div className={styles.filters}>

      {/* ── Motif de consultation ── */}
      <div className={styles.filterGroup}>
        <div className="flex items-center justify-between">
          <label className={styles.filterLabel}>Motif de consultation</label>
          {selectedMotifs.length > 0 && (
            <button className="text-[9px] text-teal-600 hover:text-teal-800 font-medium" onClick={() => onMotifChange([])}>
              Effacer
            </button>
          )}
        </div>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownButton} ${selectedMotifs.length > 0 ? 'border-teal-400 bg-teal-50/50' : ''}`}
            onClick={() => toggleDropdown('motif')}
          >
            <span className={styles.dropdownValue}>
              {buttonLabel(motifs, selectedMotifs, 'Tous les motifs')}
            </span>
            {selectedMotifs.length > 0 && (
              <span className="text-[9px] bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mr-1">
                {selectedMotifs.length}
              </span>
            )}
            <ChevronDown className={styles.dropdownIcon} />
          </button>

          {openDropdown === 'motif' && (
            <>
              <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
              <div className={styles.dropdownMenu}>
                <div className={styles.searchContainer}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className={styles.searchInput}
                    value={searchMotif}
                    onChange={(e) => setSearchMotif(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className={styles.dropdownItems}>
                  {filteredMotifs.length > 0 ? (
                    filteredMotifs.map((motif) => {
                      const isSelected = selectedMotifs.includes(motif.value);
                      return (
                        <button
                          key={motif.value}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? 'bg-teal-50' : ''}`}
                          onClick={() => onMotifChange(toggle(selectedMotifs, motif.value))}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={9} className="text-white" />}
                          </div>
                          {motif.color && (
                            <span className={styles.colorIndicator} style={{ backgroundColor: motif.color }} />
                          )}
                          {motif.label}
                        </button>
                      );
                    })
                  ) : (
                    <div className={styles.noResults}>Aucun résultat</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Agenda ── */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Agenda</label>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownButton} ${selectedAgendas.length > 0 ? 'border-teal-400 bg-teal-50/50' : ''}`}
            onClick={() => toggleDropdown('agenda')}
          >
            <span className={styles.dropdownValue}>
              {buttonLabel(agendas, selectedAgendas, 'Tous les agendas')}
            </span>
            <ChevronDown className={styles.dropdownIcon} />
          </button>

          {openDropdown === 'agenda' && (
            <>
              <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownItems}>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${selectedAgendas.length === 0 ? 'bg-teal-50 text-teal-700 font-medium' : ''}`}
                    onClick={() => { onAgendaChange([]); closeDropdown(); }}
                  >
                    Tous les agendas
                  </button>
                  {agendas.map((agenda) => {
                    const isSelected = selectedAgendas.includes(agenda.value);
                    return (
                      <button
                        key={agenda.value}
                        type="button"
                        className={`${styles.dropdownItem} ${isSelected ? 'bg-teal-50' : ''}`}
                        onClick={() => { onAgendaChange(toggle(selectedAgendas, agenda.value)); closeDropdown(); }}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check size={9} className="text-white" />}
                        </div>
                        {agenda.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Status ── */}
      <div className={styles.filterGroup}>
        <div className="flex items-center justify-between">
          <label className={styles.filterLabel}>Status</label>
          {selectedStatuses.length > 0 && (
            <button className="text-[9px] text-teal-600 hover:text-teal-800 font-medium" onClick={() => onStatusChange([])}>
              Effacer
            </button>
          )}
        </div>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownButton} ${selectedStatuses.length > 0 ? 'border-teal-400 bg-teal-50/50' : ''}`}
            onClick={() => toggleDropdown('status')}
          >
            <span className={styles.dropdownValue}>
              {buttonLabel(statuses, selectedStatuses, 'Tous les status')}
            </span>
            {selectedStatuses.length > 0 && (
              <span className="text-[9px] bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mr-1">
                {selectedStatuses.length}
              </span>
            )}
            <ChevronDown className={styles.dropdownIcon} />
          </button>

          {openDropdown === 'status' && (
            <>
              <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
              <div className={styles.dropdownMenu}>
                <div className={styles.searchContainer}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className={styles.searchInput}
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className={styles.dropdownItems}>
                  {filteredStatuses.length > 0 ? (
                    filteredStatuses.map((status) => {
                      const isSelected = selectedStatuses.includes(status.value);
                      return (
                        <button
                          key={status.value}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? 'bg-teal-50' : ''}`}
                          onClick={() => onStatusChange(toggle(selectedStatuses, status.value))}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={9} className="text-white" />}
                          </div>
                          {status.color && (
                            <span className={styles.colorIndicator} style={{ backgroundColor: status.color }} />
                          )}
                          {status.label}
                        </button>
                      );
                    })
                  ) : (
                    <div className={styles.noResults}>Aucun résultat</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
