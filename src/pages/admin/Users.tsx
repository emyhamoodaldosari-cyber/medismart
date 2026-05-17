import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, Edit, Trash2, Users as UsersIcon, Loader } from 'lucide-react';
import { adminUserService } from '../../services/adminService';
import { pharmacyService } from '../../services/pharmacyService';
import { UserProfile, Pharmacy } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import FormModal from '../../components/FormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import AdminPageHeader from '../../components/AdminPageHeader';
import StatusBadge from '../../components/StatusBadge';

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'customer' as 'customer' | 'pharmacist' | 'admin',
    pharmacy_id: null as string | null,
  });
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadUsers();
    loadPharmacies();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      showToast(error.message || t('admin.users.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPharmacies = async () => {
    try {
      const data = await pharmacyService.getAllPharmacies();
      setPharmacies(data.filter(p => p.is_active));
    } catch (error: any) {
      console.error('Failed to load pharmacies:', error);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      pharmacy_id: user.pharmacy_id || null,
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSaveLoading(true);
      
      // Update role if changed
      if (editFormData.role !== selectedUser.role) {
        await adminUserService.updateUserRole(selectedUser.id, editFormData.role);
      }
      
      // Update pharmacy if changed
      if (editFormData.pharmacy_id !== selectedUser.pharmacy_id) {
        await adminUserService.updateUserPharmacy(selectedUser.id, editFormData.pharmacy_id);
      }

      showToast(t('admin.users.userUpdated'), 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      showToast(error.message || t('admin.users.roleUpdateFailed'), 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setDeleteLoading(true);
      await adminUserService.deleteUser(selectedUser.id);
      showToast(t('admin.users.userDeleted'), 'success');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      showToast(error.message || t('admin.users.userDeleteFailed'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role === filter;
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return t('admin.users.roleAdmin');
      case 'pharmacist': return t('admin.users.rolePharmacist');
      case 'customer': return t('admin.users.roleCustomer');
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <AdminPageHeader
          title={t('admin.users.title')}
          subtitle={t('admin.users.subtitle')}
          onRefresh={loadUsers}
          refreshing={loading}
        />

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={t('admin.users.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-[#099aa7]/20 transition-all outline-none font-medium text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              {['all', 'admin', 'pharmacist', 'customer'].map((f) => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    filter === f 
                      ? 'bg-[#099aa7] text-white shadow-lg shadow-[#099aa7]/20' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? t('common.all') : t(`admin.users.role${f.charAt(0).toUpperCase() + f.slice(1)}`)}
                </button>
              ))}
              <div className="text-sm font-medium text-slate-500 ml-2">
                {filteredUsers.length} / {users.length}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center text-slate-400">{t('admin.users.loadingUsers')}</div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={t('admin.users.noUsers')}
              message={t('admin.users.noUsersMessage')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                      {t('admin.users.userIdentity')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                      {t('admin.users.securityRole')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                      {t('admin.users.joinDate')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                      {t('admin.users.operations')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#099aa7]/10 text-[#099aa7] flex items-center justify-center font-bold text-sm uppercase">
                            {user.full_name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-[#1f2f31]">{user.full_name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={user.role} type="role" label={getRoleLabel(user.role)} />
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 text-slate-400 hover:text-[#099aa7] hover:bg-[#099aa7]/10 rounded-lg transition-all"
                            title={t('actions.edit')}
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title={t('actions.delete')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSaveUser}
        title={t('admin.users.editUser')}
        loading={saveLoading}
        submitText={t('actions.save')}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1f2f31] mb-2">
              {t('admin.users.fullName')}
            </label>
            <input
              type="text"
              value={editFormData.full_name}
              disabled
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">{t('admin.users.nameNotEditable')}</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1f2f31] mb-2">
              {t('admin.users.email')}
            </label>
            <input
              type="email"
              value={editFormData.email}
              disabled
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">{t('admin.users.emailNotEditable')}</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1f2f31] mb-2">
              {t('admin.users.role')} *
            </label>
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all font-medium"
            >
              <option value="customer">{t('admin.users.roleCustomer')}</option>
              <option value="pharmacist">{t('admin.users.rolePharmacist')}</option>
              <option value="admin">{t('admin.users.roleAdmin')}</option>
            </select>
          </div>

          {editFormData.role === 'pharmacist' && (
            <div>
              <label className="block text-sm font-bold text-[#1f2f31] mb-2">
                {t('admin.users.pharmacy')}
              </label>
              <select
                value={editFormData.pharmacy_id || ''}
                onChange={(e) => setEditFormData({ ...editFormData, pharmacy_id: e.target.value || null })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all font-medium"
              >
                <option value="">{t('admin.users.selectPharmacy')}</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title={t('admin.users.confirmDelete')}
        message={t('admin.users.confirmDeleteMessage')}
        confirmText={t('actions.delete')}
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminUsers;
