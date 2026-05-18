import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { contactService } from '../services/contactService';
import { useToast } from '../contexts/ToastContext';

interface ContactFormProps {
  t: (key: string) => string;
}

const ContactForm: React.FC<ContactFormProps> = ({ t }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
  });

  const labels = {
    fullName: t('home.contact.fullName'),
    fullNamePlaceholder: t('home.contact.fullNamePlaceholder'),
    emailAddress: t('home.contact.emailAddress'),
    emailPlaceholder: t('home.contact.emailPlaceholder'),
    subject: t('home.contact.subject'),
    subjectPlaceholder: t('home.contact.subjectPlaceholder'),
    message: t('home.contact.message'),
    messagePlaceholder: t('home.contact.messagePlaceholder'),
    send: t('home.contact.send'),
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = 'Subject must be less than 200 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = 'Message must be less than 5000 characters';
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);

      const result = await contactService.submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        phone: formData.phone.trim() || undefined,
        messageType: 'general',
      });

      if (result.success) {
        showToast('Message sent successfully! We will get back to you soon.', 'success');
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          phone: '',
        });

        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        showToast(result.error || 'Failed to send message. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Contact form error:', error);
      showToast(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-gray-50 p-10 md:p-14 rounded-[50px] space-y-8 relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute inset-0 bg-white/95 rounded-[50px] flex items-center justify-center backdrop-blur-sm z-50"
        >
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#1f2f31] mb-2">Thank You!</h3>
            <p className="text-slate-600">Your message has been received.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">
            {labels.fullName}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-6 py-4 rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-gray-100'
            }`}
            placeholder={labels.fullNamePlaceholder}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">
            {labels.emailAddress}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-6 py-4 rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-100'
            }`}
            placeholder={labels.emailPlaceholder}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">
          Phone (optional)
        </label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full px-6 py-4 rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] ${
            errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-100'
          }`}
          placeholder="+966 XXX XXX XXX"
          disabled={loading}
        />
        {errors.phone && (
          <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.phone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">
          {labels.subject}
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className={`w-full px-6 py-4 rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] ${
            errors.subject ? 'border-red-500 bg-red-50' : 'border-gray-100'
          }`}
          placeholder={labels.subjectPlaceholder}
          disabled={loading}
        />
        {errors.subject && (
          <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.subject}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">
          {labels.message}
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          className={`w-full px-6 py-4 rounded-2xl bg-white border transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] resize-none ${
            errors.message ? 'border-red-500 bg-red-50' : 'border-gray-100'
          }`}
          placeholder={labels.messagePlaceholder}
          disabled={loading}
        />
        {errors.message && (
          <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.message}
          </p>
        )}
        <p className="text-xs text-slate-500 ml-1">
          {formData.message.length}/5000 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-1/2 mx-auto block py-5 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] transition-all shadow-xl shadow-[#099aa7]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader size={20} className="animate-spin" />
            Sending...
          </>
        ) : (
          labels.send
        )}
      </button>
    </motion.form>
  );
};

export default ContactForm;
