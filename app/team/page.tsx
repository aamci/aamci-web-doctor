'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Search,
  Filter,
  Check,
  X,
  Clock,
  Calendar,
  Settings,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Send,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Stethoscope,
} from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'SECRETARY' | 'NURSE' | 'ASSISTANT' | 'INTERN';
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  avatarUrl?: string;
  permissions: Permission[];
  invitedAt?: string;
  joinedAt?: string;
  lastActiveAt?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'appointments' | 'patients' | 'billing' | 'settings';
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'view_appointments', name: 'Voir les RDV', description: 'Consulter le planning', category: 'appointments' },
  { id: 'manage_appointments', name: 'Gérer les RDV', description: 'Créer, modifier, annuler', category: 'appointments' },
  { id: 'view_patients', name: 'Voir les patients', description: 'Accéder aux fiches', category: 'patients' },
  { id: 'edit_patients', name: 'Modifier les patients', description: 'Éditer les informations', category: 'patients' },
  { id: 'view_billing', name: 'Voir la facturation', description: 'Consulter les factures', category: 'billing' },
  { id: 'manage_billing', name: 'Gérer la facturation', description: 'Créer des factures', category: 'billing' },
  { id: 'view_settings', name: 'Voir les paramètres', description: 'Consulter la config', category: 'settings' },
];

const ROLE_LABELS: Record<TeamMember['role'], string> = {
  SECRETARY: 'Secrétaire',
  NURSE: 'Infirmier(ère)',
  ASSISTANT: 'Assistant(e)',
  INTERN: 'Stagiaire',
};

const ROLE_COLORS: Record<TeamMember['role'], string> = {
  SECRETARY: 'bg-blue-100 text-blue-700',
  NURSE: 'bg-green-100 text-green-700',
  ASSISTANT: 'bg-purple-100 text-purple-700',
  INTERN: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<TeamMember['status'], string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  INACTIVE: 'Inactif',
};

const STATUS_COLORS: Record<TeamMember['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);

  // Form state for adding new member
  const [newMember, setNewMember] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'SECRETARY' as TeamMember['role'],
    permissions: [] as string[],
  });
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadTeamMembers();
  }, [router]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: m.id,
          fullName: m.fullName || m.user?.fullName || 'Sans nom',
          email: m.email || m.user?.email || '',
          phone: m.phone || m.user?.phone || undefined,
          role: m.role || 'ASSISTANT',
          status: m.status || 'ACTIVE',
          permissions: (m.permissions || []).map((p: string) => AVAILABLE_PERMISSIONS.find(ap => ap.id === p)).filter(Boolean),
          avatarUrl: m.avatarUrl || m.user?.avatarUrl || undefined,
          invitedAt: m.invitedAt,
          joinedAt: m.joinedAt,
          lastActiveAt: m.lastActiveAt,
        }));
        setMembers(mapped);
      }
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!newMember.email || !newMember.fullName) return;

    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: newMember.fullName,
          email: newMember.email,
          phone: newMember.phone || undefined,
          role: newMember.role,
          permissions: newMember.permissions,
        }),
      });

      if (res.ok) {
        setInviteSuccess(true);
        setTimeout(() => {
          setShowAddModal(false);
          setInviteSuccess(false);
          setNewMember({ fullName: '', email: '', phone: '', role: 'SECRETARY', permissions: [] });
          loadTeamMembers();
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Erreur lors de l\'invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
    setShowMemberMenu(null);
  };

  const handleResendInvite = async (memberId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team/${memberId}/resend-invitation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Invitation renvoyée !');
      } else {
        alert('Erreur lors du renvoi de l\'invitation');
      }
    } catch (error) {
      console.error('Error resending invite:', error);
    }
    setShowMemberMenu(null);
  };

  const handleTogglePermission = (permissionId: string) => {
    if (showPermissionsModal && selectedMember) {
      const hasPermission = selectedMember.permissions.some(p => p.id === permissionId);

      if (hasPermission) {
        setSelectedMember({
          ...selectedMember,
          permissions: selectedMember.permissions.filter(p => p.id !== permissionId),
        });
      } else {
        const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId);
        if (permission) {
          setSelectedMember({
            ...selectedMember,
            permissions: [...selectedMember.permissions, permission],
          });
        }
      }
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedMember) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team/${selectedMember.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions: selectedMember.permissions.map(p => p.id) }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m =>
          m.id === selectedMember.id ? selectedMember : m
        ));
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
    }

    setShowPermissionsModal(false);
    setSelectedMember(null);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement de l'équipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion de l'équipe</h1>
              <p className="text-sm text-gray-500">{members.length} membre{members.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Inviter un membre
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.status === 'ACTIVE').length}
                </p>
                <p className="text-xs text-gray-500">Membres actifs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.status === 'PENDING').length}
                </p>
                <p className="text-xs text-gray-500">Invitations en attente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.role === 'SECRETARY').length}
                </p>
                <p className="text-xs text-gray-500">Secrétaires</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => ['NURSE', 'ASSISTANT'].includes(m.role)).length}
                </p>
                <p className="text-xs text-gray-500">Personnel soignant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          >
            <option value="all">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière activité
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {member.fullName.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.fullName}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[member.status]}`}>
                        {STATUS_LABELS[member.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {member.permissions.slice(0, 3).map((perm, idx) => (
                          <span
                            key={perm.id}
                            className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center"
                            title={perm.name}
                          >
                            <Shield className="w-3 h-3 text-gray-500" />
                          </span>
                        ))}
                        {member.permissions.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{member.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatLastActive(member.lastActiveAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setShowMemberMenu(showMemberMenu === member.id ? null : member.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {showMemberMenu === member.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowPermissionsModal(true);
                                setShowMemberMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Gérer les permissions
                            </button>
                            {member.status === 'PENDING' && (
                              <button
                                onClick={() => handleResendInvite(member.id)}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Send className="w-4 h-4" />
                                Renvoyer l'invitation
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Retirer de l'équipe
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun membre trouvé</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Inviter un membre</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {inviteSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation envoyée !</h3>
                    <p className="text-sm text-gray-500">
                      Un email d'invitation a été envoyé à {newMember.email}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={newMember.fullName}
                        onChange={(e) => setNewMember(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Marie Dupont"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="marie@cabinet.fr"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={newMember.phone}
                        onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Rôle *
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as TeamMember['role'] }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Permissions
                      </label>
                      <div className="space-y-2">
                        {AVAILABLE_PERMISSIONS.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={newMember.permissions.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewMember(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, perm.id],
                                  }));
                                } else {
                                  setNewMember(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== perm.id),
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                              <p className="text-xs text-gray-500">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!inviteSuccess && (
                <div className="p-6 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleInviteMember}
                    disabled={!newMember.email || !newMember.fullName || inviting}
                    className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer l'invitation
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Permissions</h2>
                    <p className="text-sm text-gray-500">{selectedMember.fullName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPermissionsModal(false);
                      setSelectedMember(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const hasPermission = selectedMember.permissions.some(p => p.id === perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        hasPermission
                          ? 'border-teal-200 bg-teal-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasPermission}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                        <p className="text-xs text-gray-500">{perm.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
