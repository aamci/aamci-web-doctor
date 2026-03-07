'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  X,
  Trash2,
  Edit,
  Phone,
  FileText,
  Pill,
  Stethoscope,
  Briefcase,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  category: 'FOLLOW_UP' | 'CALL' | 'PRESCRIPTION' | 'LAB_REVIEW' | 'ADMIN' | 'APPOINTMENT' | 'OTHER';
  dueDate: string | null;
  completedAt: string | null;
  reminderAt: string | null;
  tags: string[];
  createdAt: string;
  patient: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  urgent: number;
  todayDue: number;
  completionRate: number;
}

const PRIORITY_CONFIG = {
  LOW: { label: 'Basse', color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' },
  MEDIUM: { label: 'Moyenne', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
};

const STATUS_CONFIG = {
  TODO: { label: 'À faire', color: 'bg-gray-100 text-gray-700', icon: Circle },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Clock },
  DONE: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: X },
};

const COLUMNS: { status: Task['status']; label: string; headerColor: string; borderColor: string; dotColor: string }[] = [
  { status: 'TODO', label: 'À faire', headerColor: 'bg-gray-50 border-gray-200', borderColor: 'border-t-gray-400', dotColor: 'bg-gray-400' },
  { status: 'IN_PROGRESS', label: 'En cours', headerColor: 'bg-blue-50 border-blue-200', borderColor: 'border-t-blue-500', dotColor: 'bg-blue-500' },
  { status: 'DONE', label: 'Terminé', headerColor: 'bg-green-50 border-green-200', borderColor: 'border-t-green-500', dotColor: 'bg-green-500' },
  { status: 'CANCELLED', label: 'Annulé', headerColor: 'bg-red-50 border-red-200', borderColor: 'border-t-red-400', dotColor: 'bg-red-400' },
];

const CATEGORY_CONFIG = {
  FOLLOW_UP: { label: 'Suivi patient', icon: User, color: 'text-teal-600' },
  CALL: { label: 'Appel', icon: Phone, color: 'text-blue-600' },
  PRESCRIPTION: { label: 'Prescription', icon: Pill, color: 'text-purple-600' },
  LAB_REVIEW: { label: 'Résultats labo', icon: Stethoscope, color: 'text-amber-600' },
  ADMIN: { label: 'Administratif', icon: Briefcase, color: 'text-gray-600' },
  APPOINTMENT: { label: 'Rendez-vous', icon: Calendar, color: 'text-pink-600' },
  OTHER: { label: 'Autre', icon: FileText, color: 'text-gray-500' },
};

function getApiBase(): string {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'doctor' | 'patient'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null);
  const apiBase = getApiBase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchTasks();
    fetchStats();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/tasks/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const changeTaskStatus = async (task: Task, newStatus: Task['status']) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.patient?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    let matchesScope = true;
    if (scopeFilter === 'patient') matchesScope = !!task.patient;
    if (scopeFilter === 'doctor') matchesScope = !task.patient;
    return matchesSearch && matchesPriority && matchesScope;
  });

  const tasksByStatus = (status: Task['status']) => filteredTasks.filter((t) => t.status === status);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      changeTaskStatus(task, status);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'DONE' || task.status === 'CANCELLED') return false;
    return new Date(task.dueDate) < new Date();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'P';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Mes Tâches</h1>
              <p className="text-gray-500 text-sm">{stats?.todo || 0} à faire · {stats?.inProgress || 0} en cours · {stats?.completionRate || 0}% complétées</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Scope tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: 'all' as const, label: 'Toutes', icon: null as React.ElementType | null },
                { key: 'doctor' as const, label: 'Médecin', icon: Briefcase as React.ElementType },
                { key: 'patient' as const, label: 'Patients', icon: User as React.ElementType },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setScopeFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    scopeFilter === key ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Toutes priorités</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">Haute</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="LOW">Basse</option>
            </select>

            {/* Stats chips */}
            {stats && stats.overdue > 0 && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {stats.overdue} en retard
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: `${COLUMNS.length * 280 + (COLUMNS.length - 1) * 16}px` }}>
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.status);
            const isOver = dragOverColumn === col.status;
            return (
              <div
                key={col.status}
                className="flex flex-col flex-1 min-w-[260px]"
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null); }}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0 ${col.headerColor}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Drop zone */}
                <div
                  className={`flex-1 rounded-b-xl border border-t-4 ${col.borderColor} transition-colors overflow-y-auto ${
                    isOver ? 'bg-teal-50/60 border-teal-300' : 'bg-gray-50/80 border-gray-200'
                  }`}
                  style={{ minHeight: '60vh' }}
                >
                  <div className="p-2 space-y-2">
                    {colTasks.length === 0 && (
                      <div className={`flex items-center justify-center h-20 rounded-lg border-2 border-dashed text-xs text-gray-400 transition-colors ${
                        isOver ? 'border-teal-400 text-teal-500 bg-teal-50' : 'border-gray-300'
                      }`}>
                        Déposer ici
                      </div>
                    )}
                    {colTasks.map((task) => {
                      const priorityConfig = PRIORITY_CONFIG[task.priority];
                      const categoryConfig = CATEGORY_CONFIG[task.category];
                      const CategoryIcon = categoryConfig.icon;
                      const taskOverdue = isOverdue(task);
                      const isDragging = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all select-none ${
                            isDragging
                              ? 'opacity-40 shadow-lg rotate-1'
                              : taskOverdue
                                ? 'border-red-200 hover:shadow-md'
                                : 'border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Title row */}
                          <div className="flex items-start gap-2 mb-2">
                            <p className={`flex-1 text-sm font-medium leading-snug ${
                              task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-800'
                            }`}>
                              {task.title}
                            </p>
                            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${priorityConfig.dotColor}`} title={priorityConfig.label} />
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className={`flex items-center gap-1 text-xs ${categoryConfig.color}`}>
                              <CategoryIcon className="w-3 h-3" />
                              {categoryConfig.label}
                            </span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 text-xs ${taskOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                {taskOverdue && ' ⚠'}
                              </span>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {task.patient ? (
                                <Link
                                  href={`/patients/${task.patient.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 truncate max-w-[120px]"
                                >
                                  <User className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{task.patient.fullName}</span>
                                </Link>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Briefcase className="w-3 h-3" />
                                  Médecin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTask(null);
            fetchTasks();
            fetchStats();
          }}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}

function TaskModal({
  task,
  onClose,
  onSuccess,
  apiBase,
}: {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
  apiBase: string;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'MEDIUM');
  const [category, setCategory] = useState<Task['category']>(task?.category || 'OTHER');
  const [status, setStatus] = useState<Task['status']>(task?.status || 'TODO');
  const [scope, setScope] = useState<'doctor' | 'patient'>(task?.patient ? 'patient' : 'doctor');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [patientId, setPatientId] = useState(task?.patient?.id || '');
  const [patients, setPatients] = useState<any[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [tagsInput, setTagsInput] = useState(task?.tags.join(', ') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchPatient || searchPatient.length < 2) {
      setPatients([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${apiBase}/users/patients/search?q=${encodeURIComponent(searchPatient)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPatient, apiBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Veuillez saisir un titre');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const payload = {
        title,
        description: description || null,
        priority,
        category,
        status,
        dueDate: dueDate || null,
        patientId: scope === 'patient' ? (patientId || null) : null,
        tags: tagsInput
          ? tagsInput
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      const url = task ? `${apiBase}/tasks/${task.id}` : `${apiBase}/tasks`;
      const method = task ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = task?.patient || patients.find((p) => p.id === patientId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Scope toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de tâche</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setScope('doctor'); setPatientId(''); setSearchPatient(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  scope === 'doctor'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Ma tâche
              </button>
              <button
                type="button"
                onClick={() => setScope('patient')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  scope === 'patient'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4" />
                Tâche patient
              </button>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Appeler M. Dupont"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de la tâche..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Priorité et Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Task['category'])}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'échéance (optionnel)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Patient */}
          {scope === 'patient' && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient associé
            </label>
            {selectedPatient ? (
              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <User className="w-4 h-4 text-teal-600" />
                <span className="font-medium text-teal-900">
                  {selectedPatient.fullName || selectedPatient.email}
                </span>
                <button
                  type="button"
                  onClick={() => setPatientId('')}
                  className="ml-auto p-1 hover:bg-teal-100 rounded"
                >
                  <X className="w-4 h-4 text-teal-600" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Rechercher un patient..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPatientId(p.id);
                          setSearchPatient('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        {p.fullName || p.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="urgent, rappel, suivi"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : task ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
