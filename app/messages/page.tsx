'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/lib/toast';
import { useAuth } from '../_providers/AuthProvider';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Image,
  MoreVertical,
  Phone,
  Video,
  ChevronLeft,
  Check,
  CheckCheck,
  Clock,
  User,
  Filter,
  Star,
  StarOff,
  Archive,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
  X,
  FileText,
  Download,
  Calendar,
  Info,
  Bell,
  BellOff,
  Pin,
  Flag,
  Loader2,
  Stethoscope,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file' | 'appointment';
  fileUrl?: string;
  fileName?: string;
  appointmentData?: {
    date: string;
    type: string;
    status: 'pending' | 'confirmed' | 'cancelled';
  };
}

interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  patientAge?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isStarred: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  messages: Message[];
  lastAppointment?: string;
  isDoctor?: boolean;
}

interface DoctorResult {
  id: string;
  fullName: string;
  specialty?: string;
  avatarUrl?: string;
}

type FilterType = 'all' | 'unread' | 'starred' | 'archived';

function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showMobileList, setShowMobileList] = useState(true);

  // New conversation modal
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorResults, setDoctorResults] = useState<DoctorResult[]>([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResult | null>(null);
  const [firstMessage, setFirstMessage] = useState('');
  const [startingConv, setStartingConv] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const doctorSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = user?.id || '';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const mapped: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          patientId: conv.otherParticipant?.id || '',
          patientName: conv.otherParticipant?.fullName || 'Utilisateur',
          patientAvatar: conv.otherParticipant?.avatarUrl,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount || 0,
          isStarred: false,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          messages: [],
          isDoctor: conv.otherParticipant?.role === 'DOCTOR',
        }));
        setConversations(mapped);
        return mapped;
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
    return [];
  }, [apiBaseUrl]);

  // Handle ?recipient= param — auto-select or open new conv modal
  const handleRecipientParam = useCallback(async (convs: Conversation[]) => {
    const recipientId = searchParams.get('recipient');
    if (!recipientId) return;

    // Check if conversation already exists
    const existing = convs.find(c => c.patientId === recipientId);
    if (existing) {
      selectConversation(existing);
      return;
    }

    // Fetch doctor info to pre-fill modal
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/users/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDoctor({
          id: data.id,
          fullName: data.fullName || data.email || 'Médecin',
          specialty: data.doctorProfile?.specialty,
          avatarUrl: data.avatarUrl,
        });
        setShowNewConvModal(true);
      }
    } catch {
      // Fallback: just open the modal empty
      setShowNewConvModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, apiBaseUrl]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadConversations().then(handleRecipientParam);
  }, [router, loadConversations, handleRecipientParam]);

  // Doctor search (debounced)
  const searchDoctors = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setDoctorResults([]);
      return;
    }
    setDoctorSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/search/doctors?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data?.doctors ?? data ?? [];
        setDoctorResults(list.map((d: any) => ({
          id: d.id,
          fullName: d.fullName || d.name || d.email || '',
          specialty: d.doctorProfile?.specialty || d.specialty,
          avatarUrl: d.avatarUrl,
        })));
      }
    } catch { /* silent */ } finally {
      setDoctorSearchLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (doctorSearchTimer.current) clearTimeout(doctorSearchTimer.current);
    doctorSearchTimer.current = setTimeout(() => searchDoctors(doctorSearch), 350);
    return () => { if (doctorSearchTimer.current) clearTimeout(doctorSearchTimer.current); };
  }, [doctorSearch, searchDoctors]);

  const startConversation = async () => {
    if (!selectedDoctor || !firstMessage.trim()) return;
    setStartingConv(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedDoctor.id,
          content: firstMessage.trim(),
        }),
      });
      if (res.ok) {
        setShowNewConvModal(false);
        setSelectedDoctor(null);
        setDoctorSearch('');
        setDoctorResults([]);
        setFirstMessage('');
        const convs = await loadConversations();
        const newConv = convs.find(c => c.patientId === selectedDoctor.id);
        if (newConv) selectConversation(newConv);
      } else {
        toast.error('Erreur lors du démarrage de la conversation');
      }
    } catch {
      toast.error('Erreur lors du démarrage de la conversation');
    } finally {
      setStartingConv(false);
    }
  };

  const filteredConversations = conversations
    .filter(conv => {
      if (filter === 'unread') return conv.unreadCount > 0;
      if (filter === 'starred') return conv.isStarred;
      if (filter === 'archived') return conv.isArchived;
      return !conv.isArchived;
    })
    .filter(conv =>
      conv.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
    });

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowMobileList(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/messages/conversations/${conv.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const messages = await response.json();
        const mappedMessages: Message[] = messages.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          timestamp: m.createdAt,
          read: m.read,
          type: m.type?.toLowerCase() || 'text',
        }));

        const updatedConv = { ...conv, messages: mappedMessages, unreadCount: 0 };
        setSelectedConversation(updatedConv);
        setConversations(prev => prev.map(c =>
          c.id === conv.id ? updatedConv : c
        ));

        await fetch(`${apiBaseUrl}/messages/conversations/${conv.id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const sentMsg = await response.json();
        const newMsg: Message = {
          id: sentMsg.id,
          senderId: sentMsg.senderId,
          content: sentMsg.content,
          timestamp: sentMsg.createdAt,
          read: true,
          type: 'text',
        };

        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id
            ? {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: newMessage,
                lastMessageTime: newMsg.timestamp,
              }
            : c
        ));

        setSelectedConversation(prev =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
        );

        setNewMessage('');
      } else {
        toast.error('Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const toggleStar = (convId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, isStarred: !c.isStarred } : c
    ));
  };

  const toggleMute = (convId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, isMuted: !c.isMuted } : c
    ));
  };

  const togglePin = (convId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, isPinned: !c.isPinned } : c
    ));
  };

  const archiveConversation = (convId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, isArchived: !c.isArchived } : c
    ));
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
      setShowMobileList(true);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalUnread = conversations.filter(c => !c.isArchived).reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Messagerie</h1>
            <p className="text-xs text-gray-500">
              {totalUnread > 0 ? `${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''}` : 'Tous les messages lus'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setSelectedDoctor(null); setDoctorSearch(''); setDoctorResults([]); setFirstMessage(''); setShowNewConvModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            title="Nouveau message"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau message</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${!showMobileList && selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Search & Filters */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-1">
              {(['all', 'unread', 'starred', 'archived'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'unread' ? 'Non lus' : f === 'starred' ? 'Favoris' : 'Archives'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">Aucune conversation</p>
                <button
                  onClick={() => setShowNewConvModal(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Démarrer une conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-3 border-b border-gray-50 cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id
                      ? 'bg-teal-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                        conv.isDoctor
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                          : 'bg-gradient-to-br from-teal-400 to-teal-600'
                      }`}>
                        {conv.isDoctor
                          ? <Stethoscope className="w-5 h-5" />
                          : getInitials(conv.patientName)
                        }
                      </div>
                      {conv.isPinned && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <Pin className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900 truncate">
                            {conv.patientName}
                          </span>
                          {conv.isDoctor && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Dr</span>
                          )}
                          {conv.isStarred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                          {conv.isMuted && <BellOff className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                        <span className="text-xs text-gray-400">
                          {conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ''}
                        </span>
                      </div>

                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage || 'Aucun message'}
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center mt-1 px-2 py-0.5 bg-teal-600 text-white text-xs font-medium rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-1 text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                  selectedConversation.isDoctor
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : 'bg-gradient-to-br from-teal-400 to-teal-600'
                }`}>
                  {selectedConversation.isDoctor
                    ? <Stethoscope className="w-4 h-4" />
                    : getInitials(selectedConversation.patientName)
                  }
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{selectedConversation.patientName}</h2>
                    {selectedConversation.isDoctor && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Médecin</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.patientAge && `${selectedConversation.patientAge} ans`}
                    {selectedConversation.lastAppointment && ` - Dernier RDV: ${new Date(selectedConversation.lastAppointment).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStar(selectedConversation.id)}
                  className="p-2 text-gray-500 hover:text-amber-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {selectedConversation.isStarred ? (
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  ) : (
                    <StarOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => toggleMute(selectedConversation.id)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {selectedConversation.isMuted ? (
                    <BellOff className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </button>
                {!selectedConversation.isDoctor && (
                  <button
                    onClick={() => router.push(`/patients/${selectedConversation.patientId}`)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Voir le dossier patient"
                  >
                    <User className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => archiveConversation(selectedConversation.id)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Archive className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedConversation.messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun message dans cette conversation</p>
                    <p className="text-sm text-gray-400 mt-1">Envoyez un message pour commencer</p>
                  </div>
                </div>
              ) : (
                <>
                  {selectedConversation.messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                          {message.type === 'appointment' && message.appointmentData ? (
                            <div className={`p-4 rounded-2xl ${isOwn ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Rendez-vous</span>
                              </div>
                              <p className={`text-sm ${isOwn ? 'text-teal-100' : 'text-gray-600'}`}>
                                {message.appointmentData.type}
                              </p>
                              <p className={`text-sm ${isOwn ? 'text-teal-100' : 'text-gray-600'}`}>
                                {new Date(message.appointmentData.date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                                message.appointmentData.status === 'confirmed'
                                  ? isOwn ? 'bg-teal-500 text-white' : 'bg-green-100 text-green-700'
                                  : isOwn ? 'bg-teal-500 text-white' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {message.appointmentData.status === 'confirmed' ? 'Confirme' : 'En attente'}
                              </span>
                            </div>
                          ) : message.type === 'file' ? (
                            <div className={`p-3 rounded-2xl ${isOwn ? 'bg-teal-600' : 'bg-white border border-gray-200'}`}>
                              <div className={`flex items-center gap-3 ${isOwn ? 'text-white' : 'text-gray-700'}`}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-teal-500' : 'bg-gray-100'}`}>
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  <p className={`text-xs ${isOwn ? 'text-teal-200' : 'text-gray-500'}`}>Document PDF</p>
                                </div>
                                <button
                                  onClick={() => message.fileUrl ? window.open(message.fileUrl, '_blank') : toast.warning('Fichier non disponible')}
                                  className={`p-1.5 rounded-lg ${isOwn ? 'hover:bg-teal-500' : 'hover:bg-gray-100'}`}
                                  title="Télécharger"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`px-4 py-2.5 rounded-2xl ${
                              isOwn
                                ? 'bg-teal-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          )}

                          <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-400">
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwn && (
                              message.read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-teal-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-3">
              <div className="flex items-end gap-2">
                <button
                  onClick={() => toast.info('La fonctionnalité de pièces jointes sera bientôt disponible.')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Joindre un fichier"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ecrivez votre message..."
                    rows={1}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    style={{ maxHeight: '120px' }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-2 text-center">
                Appuyez sur Entree pour envoyer, Maj+Entree pour un saut de ligne
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Messagerie</h2>
              <p className="text-gray-500 max-w-sm mb-4">
                Selectionnez une conversation ou démarrez un nouveau message avec un patient ou un collègue médecin
              </p>
              <button
                onClick={() => setShowNewConvModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nouveau message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Nouveau message</h2>
              </div>
              <button
                onClick={() => { setShowNewConvModal(false); setSelectedDoctor(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Doctor selection */}
              {!selectedDoctor ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Stethoscope className="w-4 h-4 inline mr-1.5 text-gray-500" />
                    Rechercher un médecin
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nom du médecin..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Results */}
                  {doctorSearchLoading && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recherche...
                    </div>
                  )}
                  {!doctorSearchLoading && doctorResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {doctorResults.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => { setSelectedDoctor(doc); setDoctorSearch(''); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{doc.fullName}</div>
                            {doc.specialty && (
                              <div className="text-xs text-gray-500 truncate">{doc.specialty}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!doctorSearchLoading && doctorSearch.length >= 2 && doctorResults.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500 text-center py-2">Aucun médecin trouvé</p>
                  )}
                  {doctorSearch.length < 2 && (
                    <p className="mt-1 text-xs text-gray-400">Tapez au moins 2 caractères pour rechercher</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Selected doctor */}
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{selectedDoctor.fullName}</div>
                      {selectedDoctor.specialty && (
                        <div className="text-xs text-gray-500">{selectedDoctor.specialty}</div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDoctor(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* First message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      rows={4}
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button
                onClick={() => { setShowNewConvModal(false); setSelectedDoctor(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              {selectedDoctor && (
                <button
                  onClick={startConversation}
                  disabled={!firstMessage.trim() || startingConv}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {startingConv ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Envoyer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    }>
      <MessagesPage />
    </Suspense>
  );
}
