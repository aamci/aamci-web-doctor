'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  User,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarCheck,
  CalendarX,
  Pill,
  MessageSquare,
  X,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface SmartAlert {
  id: string;
  type: 'appointment_pending' | 'prescription_expiring' | 'payment_pending' | 'review_needed';
  title: string;
  description: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionUrl: string;
}

type NotificationFilter = 'all' | 'unread' | 'appointments' | 'alerts' | 'payments' | 'system';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const authedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${apiBaseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [apiBaseUrl]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await authedFetch('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  }, [authedFetch]);

  const computeSmartAlerts = useCallback((notifs: Notification[]) => {
    const unread = notifs.filter(n => !n.read);
    const appointmentUnread = unread.filter(n => n.type.includes('APPOINTMENT'));
    const prescriptionUnread = unread.filter(n => n.type.includes('PRESCRIPTION') || n.type.includes('EXPIRING'));
    const paymentUnread = unread.filter(n => n.type.includes('PAYMENT'));

    const alerts: SmartAlert[] = [];
    if (appointmentUnread.length > 0) {
      alerts.push({
        id: 'alert-appointments',
        type: 'appointment_pending',
        title: 'Rendez-vous en attente',
        description: 'Notifications de rendez-vous non lues',
        count: appointmentUnread.length,
        priority: 'high',
        actionLabel: 'Voir les RDV',
        actionUrl: '/planning',
      });
    }
    if (prescriptionUnread.length > 0) {
      alerts.push({
        id: 'alert-prescriptions',
        type: 'prescription_expiring',
        title: 'Ordonnances',
        description: "Notifications d'ordonnances non lues",
        count: prescriptionUnread.length,
        priority: 'medium',
        actionLabel: 'Gérer',
        actionUrl: '/prescriptions',
      });
    }
    if (paymentUnread.length > 0) {
      alerts.push({
        id: 'alert-payments',
        type: 'payment_pending',
        title: 'Paiements',
        description: 'Notifications de paiements non lues',
        count: paymentUnread.length,
        priority: 'low',
        actionLabel: 'Facturer',
        actionUrl: '/wallet',
      });
    }
    setSmartAlerts(alerts);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    loadData();
  }, [fetchNotifications]);

  useEffect(() => {
    computeSmartAlerts(notifications);
  }, [notifications, computeSmartAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await authedFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAsUnread = async (id: string) => {
    try {
      await authedFetch(`/notifications/${id}/unread`, { method: 'PATCH' });
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
  };

  const deleteNotification = async (id: string) => {
    try {
      await authedFetch(`/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const markAllAsRead = async () => {
    try {
      await authedFetch('/notifications/mark-all-read', { method: 'PATCH' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markSelectedAsRead = async () => {
    for (const id of selectedIds) {
      await markAsRead(id);
    }
    setSelectedIds(new Set());
    setShowBulkMenu(false);
  };

  const deleteSelected = async () => {
    for (const id of selectedIds) {
      await deleteNotification(id);
    }
    setSelectedIds(new Set());
    setShowBulkMenu(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'APPOINTMENT_CONFIRMED':
        return <CalendarCheck className="w-5 h-5 text-green-500" />;
      case 'APPOINTMENT_CANCELLED':
        return <CalendarX className="w-5 h-5 text-red-500" />;
      case 'APPOINTMENT_RESCHEDULED':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'NEW_PATIENT':
        return <User className="w-5 h-5 text-purple-500" />;
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'PAYMENT_PENDING':
        return <CreditCard className="w-5 h-5 text-yellow-500" />;
      case 'PRESCRIPTION_EXPIRING':
        return <Pill className="w-5 h-5 text-orange-500" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'SYSTEM_UPDATE':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'appointment_pending':
        return <Calendar className="w-6 h-6 text-orange-500" />;
      case 'prescription_expiring':
        return <Pill className="w-6 h-6 text-red-500" />;
      case 'payment_pending':
        return <CreditCard className="w-6 h-6 text-yellow-500" />;
      case 'review_needed':
        return <FileText className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: SmartAlert['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      case 'low':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const getFilterCategory = (type: string): NotificationFilter => {
    if (type.includes('APPOINTMENT')) return 'appointments';
    if (type.includes('PAYMENT')) return 'payments';
    if (type.includes('SYSTEM')) return 'system';
    if (type.includes('ALERT') || type.includes('EXPIRING')) return 'alerts';
    return 'all';
  };

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Apply filter
    if (filter === 'unread') {
      result = result.filter(n => !n.read);
    } else if (filter !== 'all') {
      result = result.filter(n => getFilterCategory(n.type) === filter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters: { value: NotificationFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Toutes', icon: <Bell className="w-4 h-4" /> },
    { value: 'unread', label: 'Non lues', icon: <BellOff className="w-4 h-4" /> },
    { value: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-4 h-4" /> },
    { value: 'alerts', label: 'Alertes', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'payments', label: 'Paiements', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'system', label: 'Système', icon: <Settings className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Centre de notifications</h1>
              <p className="text-gray-500">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer lu
            </button>
          </div>
        </div>

        {/* Smart Alerts */}
        {smartAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alertes intelligentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {smartAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border-2 ${getPriorityColor(alert.priority)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <span className="px-2 py-0.5 bg-white rounded-full text-sm font-medium text-gray-700">
                          {alert.count}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <button
                        onClick={() => router.push(alert.actionUrl as `/planning` | `/prescriptions` | `/wallet`)}
                        className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700"
                      >
                        {alert.actionLabel} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span className="font-medium">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showBulkMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={markSelectedAsRead}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Marquer comme lu
                      </button>
                      <button
                        onClick={deleteSelected}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={deselectAll}
                        className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                      >
                        Désélectionner tout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 overflow-x-auto">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.icon}
                {f.label}
                {f.value === 'unread' && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Select All */}
          {filteredNotifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={e => e.target.checked ? selectAll() : deselectAll()}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-600">
                  Sélectionner tout ({filteredNotifications.length})
                </span>
              </label>
              <span className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages || 1}
              </span>
            </div>
          )}

          {/* Notifications */}
          {paginatedNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Aucune notification trouvée' : 'Aucune notification'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-teal-600 hover:text-teal-700 text-sm"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />

                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      !notification.read ? 'bg-teal-100' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-teal-500 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-2">
                        {!notification.read ? (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marquer comme lu
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(notification.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            <BellOff className="w-3 h-3" />
                            Marquer non lu
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Settings Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/settings/notifications' as '/settings')}
            className="text-sm text-gray-500 hover:text-teal-600 flex items-center gap-2 mx-auto"
          >
            <Settings className="w-4 h-4" />
            Gérer les préférences de notification
          </button>
        </div>
      </div>
    </div>
  );
}
