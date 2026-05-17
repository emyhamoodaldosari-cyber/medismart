import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  onRefresh?: () => void;
  refreshing?: boolean;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  action,
  onRefresh,
  refreshing = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-heading font-bold text-[#1f2f31] tracking-tight">{title}</h1>
        {subtitle && <p className="max-w-2xl text-slate-600 font-medium leading-7">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#099aa7]/30 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span>{t('actions.refresh')}</span>
          </button>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#099aa7] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#099aa7]/20 transition hover:bg-[#088a96]"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminPageHeader;
