import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Icon size={40} className="text-slate-300" />
      </div>
      <h3 className="text-2xl font-bold text-[#1f2f31] mb-3">{title}</h3>
      <p className="text-slate-600 mb-8 max-w-md leading-relaxed">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all shadow-lg shadow-[#099aa7]/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
