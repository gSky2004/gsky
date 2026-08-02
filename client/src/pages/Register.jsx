import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ButtonSpinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { t, tf } = useLanguage();
  const { register } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      show(tf(t.register.accountCreated, { email: user.email }));
      navigate('/login', { state: { registeredEmail: user.email } });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <SEO title={t.seo.register} />
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900">{t.register.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.register.subtitle}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">{t.register.fullName}</label>
              <input className="input" value={form.full_name} onChange={set('full_name')} placeholder={t.register.namePh} required />
            </div>
            <div>
              <label className="label">{t.register.email}</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">{t.register.phoneNumber}</label>
              <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="07XXXXXXXX" required />
            </div>
            <div>
              <label className="label">{t.register.password}</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} placeholder={t.register.passPh} required />
            </div>
            <div>
              <label className="label">{t.register.confirmPassword}</label>
              <input className="input" type="password" value={form.confirm_password} onChange={set('confirm_password')} placeholder={t.register.repeatPh} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? <ButtonSpinner /> : t.register.create}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            {t.register.haveAccount}{' '}
            <Link to="/login" className="font-bold text-orange-500 hover:underline">{t.register.login}</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Register;
