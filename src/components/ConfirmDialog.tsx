import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger',
  loading = false,
}) => {
  const { t } = useLanguage();

  const icons = {
    danger: <XCircle size={48} className="text-red-500" />,
    warning: <AlertTriangle size={48} className="text-orange-500" />,
    info: <Info size={48} className="text-blue-500" />,
    success: <CheckCircle size={48} className="text-green-500" />,
  };

  const buttonStyles = {
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
    warning: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
    info: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
    success: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-6">{icons[type]}</div>
                <h3 className="text-2xl font-bold text-[#1f2f31] text-center mb-4">{title}</h3>
                <p className="text-slate-600 text-center mb-8 leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    {cancelText || t('actions.cancel')}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`px-6 py-3 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonStyles[type]}`}
                  >
                    {loading ? t('actions.loading') : (confirmText || t('actions.confirm'))}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
