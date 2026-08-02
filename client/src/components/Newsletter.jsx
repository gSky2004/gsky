import { useState } from 'react';
import { motion } from 'framer-motion';
import { newsletterApi } from '../services/gskyApi';
import { useToast } from '../context/ToastContext';
import { ButtonSpinner } from './ui/Spinner';
import { useLanguage } from '../context/LanguageContext';

export const Newsletter = () => {
  const { t } = useLanguage();
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', shoe_size: '', consent: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCheckbox = (e) => setForm({ ...form, consent: e.target.checked });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent) {
      show(t.newsletter.needConsent, 'error');
      return;
    }
    setLoading(true);
    try {
      await newsletterApi.subscribe(form);
      show(t.newsletter.welcome);
      setForm({ name: '', email: '', phone: '', shoe_size: '', consent: false });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-900 py-16">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-2xl px-4 text-center sm:px-6"
      >
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {t.newsletter.title} <span className="inline-block animate-bounce">👟</span>
        </h2>
        <p className="mt-2 text-slate-400">
          {t.newsletter.sub}
        </p>
        <form onSubmit={submit} className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          <input className="input sm:col-span-1" name="name" placeholder={t.newsletter.name} value={form.name} onChange={handleChange} required />
          <input className="input sm:col-span-1" type="email" name="email" placeholder={t.newsletter.email} value={form.email} onChange={handleChange} required />
          <input className="input sm:col-span-1" name="phone" placeholder={t.newsletter.phone} value={form.phone} onChange={handleChange} />
          <select className="input sm:col-span-1" name="shoe_size" value={form.shoe_size} onChange={handleChange}>
            <option value="">{t.newsletter.size}</option>
            {[39, 40, 41, 42, 43, 44].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <label className="flex items-start gap-2 text-xs text-slate-400 sm:col-span-2">
            <input type="checkbox" checked={form.consent} onChange={handleCheckbox} className="mt-0.5 h-4 w-4 accent-orange-500" />
            <span>{t.newsletter.agree}</span>
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full sm:col-span-2">
            {loading ? <ButtonSpinner /> : t.newsletter.subscribe}
          </button>
        </form>
      </motion.div>
    </section>
  );
};
