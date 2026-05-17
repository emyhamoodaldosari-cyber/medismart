import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { t, direction } = useLanguage();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError(t('auth.resetPassword.passwordTooShort'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || t('auth.resetPassword.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const iconStart = direction === 'rtl' ? 'right-5' : 'left-5';
  const inputPadding = direction === 'rtl' ? 'pr-14 pl-14' : 'pl-14 pr-14';
  const toggleSide = direction === 'rtl' ? 'left-5' : 'right-5';
  const labelSpacing = direction === 'rtl' ? 'mr-1' : 'ml-1';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-[#1f2f31]/5 p-10 lg:p-14">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#099aa7]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#099aa7]">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-heading font-bold text-[#1f2f31] tracking-tight">{t('auth.resetPassword.title')}</h2>
          <p className="text-[#363f40] mt-3 font-medium text-sm">{t('auth.resetPassword.subtitle')}</p>
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
            <h3 className="text-xl font-bold text-[#1f2f31] mb-2">{t('auth.resetPassword.successTitle')}</h3>
            <p className="text-slate-500 text-sm mb-4">{t('auth.resetPassword.successMessage')}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>{t('auth.resetPassword.newPassword')}</label>
              <div className="relative group">
                <Lock className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full h-12 ${inputPadding} bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${toggleSide} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>{t('auth.resetPassword.confirmPassword')}</label>
              <div className="relative group">
                <Lock className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full h-12 ${inputPadding} bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-12 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] shadow-xl shadow-[#099aa7]/10 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] disabled:opacity-50">
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin mr-2" />
                  {t('auth.resetPassword.processing')}
                </>
              ) : (
                t('auth.resetPassword.resetButton')
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
