import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const { t, direction } = useLanguage();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || t('auth.forgotPassword.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const iconStart = direction === 'rtl' ? 'right-5' : 'left-5';
  const inputPadding = direction === 'rtl' ? 'pr-14 pl-4' : 'pl-14 pr-4';
  const arrowClass = direction === 'rtl' ? 'rotate-180 ml-2' : 'mr-2';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-[#1f2f31]/5 p-10 lg:p-14"
      >
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="MediSmart Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
      
          <h2 className="text-3xl font-heading font-bold text-[#1f2f31] tracking-tight">{t('auth.forgotPassword.title')}</h2>
          <p className="text-[#363f40] mt-3 font-medium text-sm">{t('auth.forgotPassword.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center text-xs font-bold uppercase tracking-wider border border-red-100">
            <AlertCircle size={18} className="mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#1f2f31] mb-2">{t('auth.forgotPassword.checkEmail')}</h3>
            <p className="text-slate-500 text-sm mb-8">
              {t('auth.forgotPassword.emailSent')} <span className="font-bold text-[#1f2f31]">{email}</span>.
            </p>
            <Link to="/login" className="inline-flex items-center text-[#099aa7] font-bold text-xs uppercase tracking-widest hover:underline">
              <ArrowLeft size={14} className={arrowClass} />
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${direction === 'rtl' ? 'mr-1' : 'ml-1'}`}>
                {t('auth.forgotPassword.email')}
              </label>
              <div className="relative group">
                <Mail className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
                <input
                  type="email"
                  required
                  className={`w-full h-12 ${inputPadding} bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] shadow-xl shadow-[#099aa7]/10 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin mr-2" />
                  {t('auth.forgotPassword.processing')}
                </>
              ) : (
                t('auth.forgotPassword.sendButton')
              )}
            </button>

            <div className="text-center mt-8">
              <Link to="/login" className="inline-flex items-center text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-[#099aa7] transition-colors">
                <ArrowLeft size={12} className={arrowClass} />
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
