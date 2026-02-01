'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  FileText,
  User,
  Clock,
  AlertCircle,
  Maximize2,
  Minimize2,
  Settings,
  MonitorUp,
  X,
  Send,
  ChevronRight,
  ArrowLeft,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../_providers/AuthProvider';

interface Appointment {
  id: string;
  status: string;
  notes: string | null;
  videoSessionId: string | null;
  videoStartedAt: string | null;
  videoEndedAt: string | null;
  slot: {
    start: string;
    end: string;
  };
  patient: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  kind: {
    id: string;
    name: string;
    isTelemedicine: boolean;
  } | null;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  message: string;
  timestamp: Date;
}

export default function VisioPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.appointmentId as string;
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Side panels
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(true);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Notes
  const [consultationNotes, setConsultationNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStarted) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStarted]);

  const fetchAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Rendez-vous non trouvé');

      const data = await res.json();
      setAppointment(data);

      // Pre-fill notes if any
      if (data.notes) {
        setConsultationNotes(data.notes);
        setSavedNotes(data.notes);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les notes en brouillon (sans terminer la session)
  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: consultationNotes }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      setSavedNotes(consultationNotes);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Erreur lors de la sauvegarde du brouillon');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Vérifier si des changements non sauvegardés existent
  const hasUnsavedChanges = consultationNotes !== savedNotes;

  // Retour avec confirmation si nécessaire
  const handleBack = async () => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
    } else {
      // Stop video si en cours
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      router.push('/planning');
    }
  };

  // Confirmer le départ (sauvegarder et partir)
  const confirmLeaveAndSave = async () => {
    await saveDraft();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowLeaveConfirm(false);
    router.push('/planning');
  };

  // Confirmer le départ sans sauvegarder
  const confirmLeaveWithoutSave = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowLeaveConfirm(false);
    router.push('/planning');
  };

  const startCall = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setCallStarted(true);

      // Update appointment video session
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/appointments/${appointmentId}/start-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Impossible d\'accéder à la caméra ou au microphone');
    }
  };

  const endCall = async () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCallStarted(false);

    try {
      // Save notes and end video session
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/end-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: consultationNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      // Marquer comme sauvegardé
      setSavedNotes(consultationNotes);
      setLastSaved(new Date());

      router.push('/planning');
    } catch (err: any) {
      console.error('Error ending call:', err);
      setError(`Erreur lors de la fin de consultation: ${err.message}`);
      // Ne pas rediriger en cas d'erreur pour que l'utilisateur puisse réessayer
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing, revert to camera
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = stream.getVideoTracks()[0];

      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current.addTrack(newVideoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          localStreamRef.current.removeTrack(videoTrack);
          localStreamRef.current.addTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'doctor',
      message: newMessage,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4">Chargement de la consultation...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Erreur</h2>
          <p className="text-gray-400 mb-4">{error || 'Rendez-vous non trouvé'}</p>
          <button
            onClick={() => router.push('/planning')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retour au planning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 flex ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Retour</span>
            </button>
            <div>
              <h1 className="text-white font-semibold">
                Téléconsultation - {appointment.patient?.fullName || 'Patient'}
              </h1>
              <p className="text-gray-400 text-sm">
                {appointment.kind?.name || 'Consultation'} • {formatTime(appointment.slot.start)}
                {hasUnsavedChanges && (
                  <span className="ml-2 text-yellow-400">• Non sauvegardé</span>
                )}
                {lastSaved && !hasUnsavedChanges && (
                  <span className="ml-2 text-green-400">• Sauvegardé</span>
                )}
              </p>
            </div>
          </div>

          {callStarted && (
            <div className="flex items-center gap-2 text-white">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPatientInfo(!showPatientInfo)}
              className={`p-2 rounded-lg ${showPatientInfo ? 'bg-teal-600' : 'bg-gray-700'} text-white`}
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg ${showChat ? 'bg-teal-600' : 'bg-gray-700'} text-white`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg ${showNotes ? 'bg-teal-600' : 'bg-gray-700'} text-white`}
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          {!callStarted ? (
            // Pre-call screen
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
                {appointment.patient?.avatarUrl ? (
                  <img
                    src={appointment.patient.avatarUrl}
                    alt={appointment.patient.fullName || ''}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-white font-bold">
                    {appointment.patient?.fullName?.[0]?.toUpperCase() || 'P'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {appointment.patient?.fullName || 'Patient'}
              </h2>
              <p className="text-gray-400 mb-8">
                {appointment.kind?.name || 'Consultation'} - {formatTime(appointment.slot.start)}
              </p>
              <button
                onClick={startCall}
                className="px-8 py-4 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors flex items-center gap-3 mx-auto text-lg font-medium"
              >
                <Video className="w-6 h-6" />
                Démarrer la téléconsultation
              </button>
            </div>
          ) : (
            // Video streams
            <>
              {/* Remote video (patient) - Main */}
              <div className="absolute inset-4 bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Placeholder when patient not connected */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-400">En attente du patient...</p>
                  </div>
                </div>
              </div>

              {/* Local video (doctor) - PIP */}
              <div className="absolute bottom-24 right-8 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        {callStarted && (
          <div className="bg-gray-800 px-4 py-4 flex items-center justify-center gap-4 border-t border-gray-700">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full ${
                isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              } text-white transition-colors`}
            >
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              } text-white transition-colors`}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full ${
                isScreenSharing ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white transition-colors`}
            >
              <MonitorUp className="w-6 h-6" />
            </button>

            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <Phone className="w-6 h-6 rotate-[135deg]" />
            </button>
          </div>
        )}
      </div>

      {/* Side Panel */}
      {(showPatientInfo || showChat || showNotes) && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Patient Info */}
          {showPatientInfo && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations patient
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold">
                    {appointment.patient?.fullName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{appointment.patient?.fullName}</p>
                    <p className="text-gray-400 text-xs">{appointment.patient?.email}</p>
                  </div>
                </div>
                {appointment.patient?.phone && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Tél:</span> {appointment.patient.phone}
                  </p>
                )}
                <div className="pt-2 mt-2 border-t border-gray-700">
                  <p className="text-gray-400">
                    <span className="text-gray-500">Motif:</span>{' '}
                    {appointment.kind?.name || 'Consultation'}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Horaire:</span>{' '}
                    {formatTime(appointment.slot.start)} - {formatTime(appointment.slot.end)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/patients/${appointment.patient?.id}`)}
                className="mt-3 w-full py-2 text-sm text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1"
              >
                Voir le dossier complet
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat */}
          {showChat && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">Aucun message</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          msg.sender === 'doctor'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Votre message..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {showNotes && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes de consultation
                </h3>
                <button
                  onClick={saveDraft}
                  disabled={isSavingDraft || !hasUnsavedChanges}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                    ${hasUnsavedChanges
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {isSavingDraft ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasUnsavedChanges ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSavingDraft ? 'Sauvegarde...' : hasUnsavedChanges ? 'Sauvegarder' : 'Sauvegardé'}
                </button>
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Prenez des notes pendant la consultation..."
                  className="w-full flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm resize-none focus:outline-none focus:border-teal-500"
                />
                {lastSaved && (
                  <p className="text-xs text-gray-500 mt-2">
                    Dernière sauvegarde: {lastSaved.toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation pour quitter */}
      {showLeaveConfirm && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowLeaveConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-xl p-6 z-50 w-full max-w-md shadow-2xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              Notes non sauvegardées
            </h3>
            <p className="text-gray-400 mb-6">
              Vous avez des notes non sauvegardées. Que souhaitez-vous faire ?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmLeaveAndSave}
                disabled={isSavingDraft}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder et quitter
              </button>
              <button
                onClick={confirmLeaveWithoutSave}
                className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
              >
                Quitter sans sauvegarder
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
