'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Shield,
  Camera,
  Check,
  X,
  Edit3,
  Save,
  Building2,
  Stethoscope,
  Award,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api } from './_lib/api';
import { useToast } from './_lib/useToast';

type UserType = {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: 'M' | 'F' | 'O' | null;
  birthDate?: string | null;
};

type DoctorProfile = {
  id: string;
  userId: string;
  specialty?: string | null;
  hospitalType?: string | null;
  address?: string | null;
  city?: string | null;
  presentation?: string | null;
  formations?: string | null;
  experiences?: string | null;
};

const EMPTY_PROFILE: DoctorProfile = {
  id: 'temp',
  userId: 'temp',
  specialty: '',
  hospitalType: '',
  address: '',
  city: '',
  presentation: '',
  formations: '',
  experiences: '',
};

const TABS = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'professionnel', label: 'Professionnel', icon: Briefcase },
  { id: 'signature', label: 'Signature', icon: FileText },
  { id: 'securite', label: 'Sécurité', icon: Shield },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AccountClient() {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('profil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: '' as 'M' | 'F' | 'O' | '',
    birthDate: '',
    address: '',
    city: '',
    specialty: '',
    hospitalType: '',
    presentation: '',
    formations: '',
    experiences: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');

  useEffect(() => {
    const saved = localStorage.getItem('doctorSignature');
    if (saved) setSavedSignature(saved);
  }, []);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPosRef.current = pos;
  }, []);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Check if canvas is blank
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (dataUrl === blank.toDataURL('image/png')) {
      toast('Veuillez dessiner votre signature avant de sauvegarder', 'error');
      return;
    }
    localStorage.setItem('doctorSignature', dataUrl);
    setSavedSignature(dataUrl);
    toast('Signature enregistrée avec succès', 'success');
  }, [toast]);

  const deleteSignature = useCallback(() => {
    localStorage.removeItem('doctorSignature');
    setSavedSignature(null);
    clearCanvas();
    toast('Signature supprimée', 'success');
  }, [clearCanvas, toast]);

  const handleSignatureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      localStorage.setItem('doctorSignature', dataUrl);
      setSavedSignature(dataUrl);
      toast('Signature importée avec succès', 'success');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  async function ensureProfile(): Promise<DoctorProfile> {
    try {
      return await api.get('/doctor-profiles/me');
    } catch (e: any) {
      if (e?.status === 404) {
        const created = await api.post('/doctor-profiles', {});
        return created?.id ? created : await api.get('/doctor-profiles/me');
      }
      throw e;
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/me');
        setUser(me);
        const prof = await ensureProfile();
        setProfile(prof);
        // Initialize form data
        setFormData({
          fullName: me.fullName || '',
          phone: me.phone || '',
          gender: me.gender || '',
          birthDate: me.birthDate?.split('T')[0] || '',
          address: prof?.address || '',
          city: prof?.city || '',
          specialty: prof?.specialty || '',
          hospitalType: prof?.hospitalType || '',
          presentation: prof?.presentation || '',
          formations: prof?.formations || '',
          experiences: prof?.experiences || '',
        });
      } catch (e: any) {
        if (e?.status === 401) {
          window.location.href = '/auth/login';
        } else {
          toast('Impossible de charger votre compte', 'error');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user data
      const updatedUser = await api.put('/me', {
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender || null,
        birthDate: formData.birthDate || null,
      });
      setUser(updatedUser);

      // Update profile data
      const updatedProfile = await api.put('/doctor-profiles/me', {
        address: formData.address,
        city: formData.city,
        specialty: formData.specialty,
        hospitalType: formData.hospitalType,
        presentation: formData.presentation,
        formations: formData.formations,
        experiences: formData.experiences,
      });
      setProfile(updatedProfile);

      toast('Profil mis à jour avec succès', 'success');
      setEditMode(false);
    } catch (e) {
      toast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast('Mot de passe mis à jour', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast('Erreur lors du changement de mot de passe', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/upload/avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formDataUpload,
        }
      );
      const data = await response.json();
      if (data.url) {
        const updated = await api.put('/me', { avatarUrl: data.url });
        setUser(updated);
        toast('Photo mise à jour', 'success');
      }
    } catch (e) {
      toast('Erreur lors du téléchargement', 'error');
    }
  };

  // Calculate profile completion
  const getProfileCompletion = () => {
    const checks = [
      { done: !!user?.avatarUrl, label: 'Photo de profil', icon: Camera },
      { done: !!user?.fullName, label: 'Nom complet', icon: User },
      { done: !!user?.phone, label: 'Téléphone', icon: Phone },
      { done: !!profile?.specialty, label: 'Spécialité', icon: Stethoscope },
      { done: !!profile?.city, label: 'Ville', icon: MapPin },
      { done: !!profile?.presentation, label: 'Présentation', icon: FileText },
      { done: !!profile?.formations, label: 'Formations', icon: GraduationCap },
    ];
    const completed = checks.filter((c) => c.done).length;
    const percent = Math.round((completed / checks.length) * 100);
    return { checks, completed, total: checks.length, percent };
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'DR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const safeProfile = profile ?? EMPTY_PROFILE;
  const completion = getProfileCompletion();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mon compte</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez vos informations personnelles et professionnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Cover */}
              <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-600"></div>

              {/* Avatar & Info */}
              <div className="px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="relative inline-block">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || 'Avatar'}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {getInitials(user.fullName)}
                        </span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors shadow-lg">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900">{user.fullName || 'Docteur'}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>

                {safeProfile.specialty && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>{safeProfile.specialty}</span>
                  </div>
                )}
                {safeProfile.city && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>{safeProfile.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
              <nav className="space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-gray-300'}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Qualité du profil</h3>
                <span className={`text-2xl font-bold ${completion.percent >= 80 ? 'text-green-600' : completion.percent >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {completion.percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full transition-all duration-500 ${
                    completion.percent >= 80 ? 'bg-green-500' : completion.percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${completion.percent}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {completion.checks.map((check, index) => {
                  const Icon = check.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        check.done ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        check.done ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {check.done ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <X className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{check.label}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Un profil complet augmente votre visibilité et inspire confiance aux patients.
              </p>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Content Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'profil' && 'Informations personnelles'}
                    {activeTab === 'contact' && 'Coordonnées'}
                    {activeTab === 'professionnel' && 'Informations professionnelles'}
                    {activeTab === 'signature' && 'Signature électronique'}
                    {activeTab === 'securite' && 'Sécurité du compte'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'profil' && 'Vos informations de base'}
                    {activeTab === 'contact' && 'Comment vos patients peuvent vous joindre'}
                    {activeTab === 'professionnel' && 'Votre parcours et votre expertise'}
                    {activeTab === 'signature' && 'Apposée automatiquement sur vos ordonnances et factures'}
                    {activeTab === 'securite' && 'Gérez votre mot de passe'}
                  </p>
                </div>
                {activeTab !== 'securite' && activeTab !== 'signature' && (
                  <button
                    onClick={() => (editMode ? handleSave() : setEditMode(true))}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      editMode
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editMode ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                    {editMode ? 'Enregistrer' : 'Modifier'}
                  </button>
                )}
              </div>

              {/* Profile Tab */}
              {activeTab === 'profil' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Dr. Jean Dupont"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {user.fullName || '—'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                        {user.email}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Genre
                      </label>
                      {editMode ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'O' | '' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Non spécifié</option>
                          <option value="M">Homme</option>
                          <option value="F">Femme</option>
                          <option value="O">Autre</option>
                        </select>
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {user.gender === 'M' ? 'Homme' : user.gender === 'F' ? 'Femme' : user.gender === 'O' ? 'Autre' : '—'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de naissance
                      </label>
                      {editMode ? (
                        <input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {user.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Téléphone
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="+33 6 12 34 56 78"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {user.phone || '—'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                        {user.email}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Adresse
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="123 Rue de la Santé"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {safeProfile.address || '—'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Ville
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Paris"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {safeProfile.city || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 'professionnel' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Stethoscope className="w-4 h-4 inline mr-2" />
                        Spécialité
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Médecine générale"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {safeProfile.specialty || '—'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Type d'établissement
                      </label>
                      {editMode ? (
                        <select
                          value={formData.hospitalType}
                          onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Cabinet privé">Cabinet privé</option>
                          <option value="Clinique">Clinique</option>
                          <option value="Hôpital">Hôpital</option>
                          <option value="CHU">CHU</option>
                          <option value="Centre de santé">Centre de santé</option>
                        </select>
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                          {safeProfile.hospitalType || '—'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Présentation
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.presentation}
                        onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Décrivez votre pratique, votre approche avec les patients..."
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 whitespace-pre-wrap">
                        {safeProfile.presentation || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="w-4 h-4 inline mr-2" />
                      Formations
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.formations}
                        onChange={(e) => setFormData({ ...formData, formations: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Diplômes, certifications, formations continues..."
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 whitespace-pre-wrap">
                        {safeProfile.formations || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Award className="w-4 h-4 inline mr-2" />
                      Expériences
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.experiences}
                        onChange={(e) => setFormData({ ...formData, experiences: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Postes précédents, domaines d'expertise..."
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 whitespace-pre-wrap">
                        {safeProfile.experiences || '—'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Signature Tab */}
              {activeTab === 'signature' && (
                <div className="space-y-6">
                  {/* Saved signature preview */}
                  {savedSignature && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Signature enregistrée
                          </h3>
                          <p className="text-xs text-green-600 mt-0.5">Automatiquement apposée sur vos ordonnances et factures</p>
                        </div>
                        <button
                          onClick={deleteSignature}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer la signature"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-white border border-green-200 rounded-lg p-3 inline-block">
                        <img src={savedSignature} alt="Votre signature" className="h-16 max-w-[280px] object-contain" />
                      </div>
                    </div>
                  )}

                  {/* Mode selector */}
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                    <button
                      onClick={() => setSignatureMode('draw')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signatureMode === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      ✏️ Dessiner
                    </button>
                    <button
                      onClick={() => setSignatureMode('upload')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signatureMode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      📁 Importer une image
                    </button>
                  </div>

                  {signatureMode === 'draw' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Dessinez votre signature dans le cadre ci-dessous avec votre souris ou votre doigt.</p>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 relative">
                        <canvas
                          ref={canvasRef}
                          width={560}
                          height={160}
                          className="w-full rounded-xl cursor-crosshair touch-none"
                          style={{ display: 'block' }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                        <div className="absolute bottom-2 left-3 text-xs text-gray-400 pointer-events-none select-none">Signez ici</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={clearCanvas}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Effacer
                        </button>
                        <button
                          onClick={saveSignature}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Enregistrer la signature
                        </button>
                      </div>
                    </div>
                  )}

                  {signatureMode === 'upload' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Importez une image de votre signature (PNG ou JPG, fond transparent recommandé).</p>
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="text-center">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">Cliquez pour importer</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG — fond transparent recommandé</p>
                        </div>
                        <input type="file" accept="image/png,image/jpeg,image/gif" onChange={handleSignatureUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">💡 Information :</span> Votre signature est stockée localement sur cet appareil et n'est pas envoyée au serveur. Elle sera automatiquement intégrée à toutes vos ordonnances et factures générées sur cet appareil.
                    </p>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'securite' && (
                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    Changer le mot de passe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
