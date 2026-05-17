import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  size = 'lg',
  loading = false,
  submitText,
  cancelText,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className={`relative w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <h2 className="text-2xl font-bold text-[#1f2f31]">{title}</h2>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={onSubmit}>
                  <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {children}
                  </div>
                  <div className="flex gap-3 p-6 border-t border-slate-100 justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      {cancelText || t('actions.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          {t('actions.saving')}
                        </>
                      ) : (
                        submitText || t('actions.save')
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FormModal;
