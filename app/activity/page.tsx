'use client';

import { useState } from 'react';
import {
  Activity,
  Download,
  Calendar,
  Users,
  Euro,
  TrendingUp,
  TrendingDown,
  Video,
  MapPin,
  Home,
  Stethoscope,
  ChevronDown,
  Filter,
} from 'lucide-react';

// Types
interface ActivityStats {
  consultations: number;
  consultationsTrend: number;
  newPatients: number;
  newPatientsTrend: number;
  revenue: number;
  revenueTrend: number;
  cancellationRate: number;
  cancellationTrend: number;
}

interface ConsultationData {
  date: string;
  count: number;
}

interface TypeDistribution {
  type: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface RecentActivity {
  date: string;
  consultations: number;
}

// Mock data
const MOCK_STATS: ActivityStats = {
  consultations: 89,
  consultationsTrend: 12,
  newPatients: 3,
  newPatientsTrend: -5,
  revenue: 12450,
  revenueTrend: 8,
  cancellationRate: 12,
  cancellationTrend: -2,
};

const MOCK_EVOLUTION_DATA: ConsultationData[] = [
  { date: '01/01', count: 12 },
  { date: '02/01', count: 15 },
  { date: '03/01', count: 8 },
  { date: '04/01', count: 22 },
  { date: '05/01', count: 18 },
  { date: '06/01', count: 25 },
  { date: '07/01', count: 20 },
  { date: '08/01', count: 28 },
  { date: '09/01', count: 15 },
  { date: '10/01', count: 32 },
  { date: '11/01', count: 24 },
  { date: '12/01', count: 30 },
  { date: '13/01', count: 22 },
  { date: '14/01', count: 35 },
];

const MOCK_TYPE_DISTRIBUTION: TypeDistribution[] = [
  { type: 'ON_SITE', label: 'Consultation sur site', count: 51, percentage: 57, color: '#3B82F6' },
  { type: 'TELECONSULTATION', label: 'Téléconsultation', count: 18, percentage: 20, color: '#10B981' },
  { type: 'HOME_VISIT', label: 'Visite à domicile', count: 12, percentage: 14, color: '#F59E0B' },
  { type: 'OTHER', label: 'Autre', count: 8, percentage: 9, color: '#8B5CF6' },
];

const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
  { date: 'Lun', consultations: 8 },
  { date: 'Mar', consultations: 12 },
  { date: 'Mer', consultations: 6 },
  { date: 'Jeu', consultations: 15 },
  { date: 'Ven', consultations: 18 },
  { date: 'Sam', consultations: 4 },
  { date: 'Dim', consultations: 0 },
  { date: 'Lun', consultations: 10 },
  { date: 'Mar', consultations: 14 },
  { date: 'Mer', consultations: 8 },
  { date: 'Jeu', consultations: 16 },
  { date: 'Ven', consultations: 20 },
  { date: 'Sam', consultations: 5 },
  { date: 'Dim', consultations: 2 },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: '90days', label: '3 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Période personnalisée' },
];

export default function ActivityPage() {
  const [period, setPeriod] = useState('30days');
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPractitioner, setSelectedPractitioner] = useState('all');

  const stats = MOCK_STATS;
  const evolutionData = MOCK_EVOLUTION_DATA;
  const typeDistribution = MOCK_TYPE_DISTRIBUTION;
  const recentActivity = MOCK_RECENT_ACTIVITY;

  // Calculate max for charts
  const maxEvolution = Math.max(...evolutionData.map(d => d.count));
  const maxRecent = Math.max(...recentActivity.map(d => d.consultations));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-teal-600" />
                <h1 className="text-2xl font-bold text-gray-900">Activité</h1>
              </div>
              <p className="text-gray-500 text-sm">
                Suivez l'évolution de votre activité et analysez vos performances
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-teal-50 border border-teal-200 rounded-lg text-sm font-medium text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 pointer-events-none" />
            </div>

            <div className="h-8 w-px bg-gray-200" />

            {/* Filter buttons */}
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
              <Video className="w-4 h-4" />
              Vidéos
            </button>

            <div className="relative">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-gray-100 border-0 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">Tous les sites</option>
                <option value="cabinet1">Cabinet Principal</option>
                <option value="cabinet2">Cabinet Secondaire</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-gray-100 border-0 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">Tous les types</option>
                <option value="consultation">Consultation</option>
                <option value="teleconsultation">Téléconsultation</option>
                <option value="home">Visite à domicile</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedPractitioner}
                onChange={(e) => setSelectedPractitioner(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-gray-100 border-0 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">Tous les praticiens</option>
                <option value="dr1">Dr. Martin Dupont</option>
                <option value="dr2">Dr. Sophie Bernard</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Consultations */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.consultationsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.consultationsTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stats.consultationsTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.consultations}</p>
            <p className="text-sm text-gray-500">Consultations</p>
          </div>

          {/* New Patients */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.newPatientsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.newPatientsTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stats.newPatientsTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.newPatients}</p>
            <p className="text-sm text-gray-500">Nouveaux patients</p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-purple-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stats.revenueTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.revenue.toLocaleString('fr-FR')} €</p>
            <p className="text-sm text-gray-500">Chiffre d'affaires</p>
          </div>

          {/* Cancellation Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.cancellationTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.cancellationTrend <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {Math.abs(stats.cancellationTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.cancellationRate}%</p>
            <p className="text-sm text-gray-500">Taux d'annulation</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Evolution Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Évolution des consultations</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded-full font-medium">
                  Jour
                </button>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                  Semaine
                </button>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                  Mois
                </button>
              </div>
            </div>

            {/* Simple Line Chart */}
            <div className="h-64 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
                <span>{maxEvolution}</span>
                <span>{Math.round(maxEvolution * 0.75)}</span>
                <span>{Math.round(maxEvolution * 0.5)}</span>
                <span>{Math.round(maxEvolution * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-10 h-full flex items-end pb-8 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 bottom-8 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-b border-gray-100 w-full" />
                  ))}
                </div>

                {/* SVG Line Chart */}
                <svg className="absolute inset-0 bottom-8" viewBox={`0 0 ${evolutionData.length * 50} 200`} preserveAspectRatio="none">
                  {/* Area fill */}
                  <path
                    d={`M 0 200 ${evolutionData.map((d, i) => `L ${i * 50 + 25} ${200 - (d.count / maxEvolution) * 180}`).join(' ')} L ${(evolutionData.length - 1) * 50 + 25} 200 Z`}
                    fill="url(#areaGradient)"
                  />
                  {/* Line */}
                  <path
                    d={`M ${evolutionData.map((d, i) => `${i * 50 + 25} ${200 - (d.count / maxEvolution) * 180}`).join(' L ')}`}
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2"
                  />
                  {/* Dots */}
                  {evolutionData.map((d, i) => (
                    <circle
                      key={i}
                      cx={i * 50 + 25}
                      cy={200 - (d.count / maxEvolution) * 180}
                      r="4"
                      fill="#0D9488"
                    />
                  ))}
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
                  {evolutionData.filter((_, i) => i % 2 === 0).map((d, i) => (
                    <span key={i}>{d.date}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Type Distribution Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Répartition par type</h3>

            <div className="flex items-center gap-8">
              {/* Pie Chart */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    let cumulative = 0;
                    return typeDistribution.map((item, i) => {
                      const startAngle = cumulative * 3.6;
                      cumulative += item.percentage;
                      const endAngle = cumulative * 3.6;
                      const largeArc = item.percentage > 50 ? 1 : 0;

                      const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                      const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                      const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                      const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                      return (
                        <path
                          key={i}
                          d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                          fill={item.color}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      );
                    });
                  })()}
                  {/* Center circle for donut effect */}
                  <circle cx="50" cy="50" r="25" fill="white" />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.consultations}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {typeDistribution.map((item) => {
                  const Icon = item.type === 'ON_SITE' ? MapPin :
                              item.type === 'TELECONSULTATION' ? Video :
                              item.type === 'HOME_VISIT' ? Home : Stethoscope;

                  return (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        <span className="text-sm text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Activité récente</h3>
            <p className="text-sm text-gray-500">14 derniers jours</p>
          </div>

          {/* Bar Chart */}
          <div className="h-48 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
              <span>{maxRecent}</span>
              <span>{Math.round(maxRecent * 0.5)}</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-10 h-full flex items-end gap-2 pb-8">
              {recentActivity.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${(day.consultations / maxRecent) * 140}px` }}
                    title={`${day.consultations} consultations`}
                  />
                  <span className="text-xs text-gray-400 mt-2">{day.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
