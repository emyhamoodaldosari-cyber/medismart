import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusBadgeProps {
  status: string;
  type?: 'role' | 'active' | 'order' | 'prescription' | 'custom';
  label?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'custom', label }) => {
  const { t } = useLanguage();

  const getStyles = () => {
    if (type === 'role') {
      const roleStyles: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-700',
        pharmacist: 'bg-blue-100 text-blue-700',
        customer: 'bg-green-100 text-green-700',
      };
      return roleStyles[status] || 'bg-slate-100 text-slate-700';
    }
    if (type === 'active') {
      return status === 'true' || status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600';
    }
    if (type === 'order') {
      const orderStyles: Record<string, string> = {
        pending: 'bg-orange-100 text-orange-700',
        confirmed: 'bg-blue-100 text-blue-700',
        preparing: 'bg-purple-100 text-purple-700',
        ready: 'bg-cyan-100 text-cyan-700',
        out_for_delivery: 'bg-indigo-100 text-indigo-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
        rejected: 'bg-red-100 text-red-700',
      };
      return orderStyles[status] || 'bg-slate-100 text-slate-700';
    }
    if (type === 'prescription') {
      const prescriptionStyles: Record<string, string> = {
        pending: 'bg-orange-100 text-orange-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
      };
      return prescriptionStyles[status] || 'bg-slate-100 text-slate-700';
    }
    return 'bg-slate-100 text-slate-700';
  };

  const getIcon = () => {
    if (type === 'active') return status === 'true' || status === 'active' ? <Check size={14} /> : <X size={14} />;
    if ((type === 'order' || type === 'prescription') && status === 'pending') return <Clock size={14} />;
    if (status === 'completed' || status === 'approved') return <Check size={14} />;
    if (status === 'cancelled' || status === 'rejected') return <X size={14} />;
    return null;
  };

  const resolvedLabel = () => {
    if (label) return label;
    if (type === 'order') return t(`customer.orders.statusLabels.${status}`);
    if (type === 'role') {
      return t(`customer.profile.roleLabels.${status}`);
    }
    if (type === 'active') return status === 'true' || status === 'active' ? t('common.active') : t('common.inactive');
    if (type === 'prescription') return t(`common.${status === 'approved' ? 'approved' : status === 'pending' ? 'pending' : 'rejected'}`);
    return status;
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStyles()}`}>
      {getIcon()}
      {resolvedLabel()}
    </span>
  );
};

export default StatusBadge;
