'use client';

import { ChevronDown, Search } from 'lucide-react';
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
  selectedMotif: string;
  selectedAgenda: string;
  selectedStatus: string;
  onMotifChange: (value: string) => void;
  onAgendaChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function PlanningFilters({
  motifs,
  agendas,
  statuses,
  selectedMotif,
  selectedAgenda,
  selectedStatus,
  onMotifChange,
  onAgendaChange,
  onStatusChange,
}: PlanningFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchMotif, setSearchMotif] = useState('');
  const [searchAgenda, setSearchAgenda] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
    // Reset search when opening
    if (openDropdown !== name) {
      setSearchMotif('');
      setSearchAgenda('');
      setSearchStatus('');
    }
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
    setSearchMotif('');
    setSearchAgenda('');
    setSearchStatus('');
  };

  // Filter options based on search
  const filteredMotifs = motifs.filter((m) =>
    m.label.toLowerCase().includes(searchMotif.toLowerCase())
  );
  const filteredAgendas = agendas.filter((a) =>
    a.label.toLowerCase().includes(searchAgenda.toLowerCase())
  );
  const filteredStatuses = statuses.filter((s) =>
    s.label.toLowerCase().includes(searchStatus.toLowerCase())
  );

  return (
    <div className={styles.filters}>
      {/* Filtre Motif de Consultation */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Motif de consultation</label>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => toggleDropdown('motif')}
          >
            <span className={styles.dropdownValue}>
              {motifs.find((m) => m.value === selectedMotif)?.label || 'Tous les motifs'}
            </span>
            <ChevronDown className={styles.dropdownIcon} />
          </button>
          {openDropdown === 'motif' && (
            <>
              <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
              <div className={styles.dropdownMenu}>
                {/* Barre de recherche */}
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
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      onMotifChange('');
                      closeDropdown();
                    }}
                  >
                    Tous les motifs
                  </button>
                  {filteredMotifs.length > 0 ? (
                    filteredMotifs.map((motif) => (
                      <button
                        key={motif.value}
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          onMotifChange(motif.value);
                          closeDropdown();
                        }}
                      >
                        {motif.color && (
                          <span
                            className={styles.colorIndicator}
                            style={{ backgroundColor: motif.color }}
                          />
                        )}
                        {motif.label}
                      </button>
                    ))
                  ) : (
                    <div className={styles.noResults}>Aucun résultat</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filtre Agenda */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Agenda</label>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => toggleDropdown('agenda')}
          >
            <span className={styles.dropdownValue}>
              {agendas.find((a) => a.value === selectedAgenda)?.label || 'Tous les agendas'}
            </span>
            <ChevronDown className={styles.dropdownIcon} />
          </button>
          {openDropdown === 'agenda' && (
            <>
              <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
              <div className={styles.dropdownMenu}>
                {/* Barre de recherche */}
                <div className={styles.searchContainer}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className={styles.searchInput}
                    value={searchAgenda}
                    onChange={(e) => setSearchAgenda(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className={styles.dropdownItems}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      onAgendaChange('');
                      closeDropdown();
                    }}
                  >
                    Tous les agendas
                  </button>
                  {filteredAgendas.length > 0 ? (
                    filteredAgendas.map((agenda) => (
                      <button
                        key={agenda.value}
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          onAgendaChange(agenda.value);
                          closeDropdown();
                        }}
                      >
                        {agenda.label}
                      </button>
                    ))
                  ) : (
                    <div className={styles.noResults}>Aucun résultat</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filtre Status */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Status</label>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => toggleDropdown('status')}
          >
            <span className={styles.dropdownValue}>
              {statuses.find((s) => s.value === selectedStatus)?.label || 'Tous les status'}
            </span>
            <ChevronDown className={styles.dropdownIcon} />
          </button>
          {openDropdown === 'status' && (
            <>
              <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
              <div className={styles.dropdownMenu}>
                {/* Barre de recherche */}
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
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      onStatusChange('');
                      closeDropdown();
                    }}
                  >
                    Tous les status
                  </button>
                  {filteredStatuses.length > 0 ? (
                    filteredStatuses.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          onStatusChange(status.value);
                          closeDropdown();
                        }}
                      >
                        {status.color && (
                          <span
                            className={styles.colorIndicator}
                            style={{ backgroundColor: status.color }}
                          />
                        )}
                        {status.label}
                      </button>
                    ))
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
