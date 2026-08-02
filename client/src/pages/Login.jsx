import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ButtonSpinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { t, tf } = useLanguage();
  const { login } = useAuth();
  const { load } = useCart();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = location.state?.registeredEmail;
  const [form, setForm] = useState({ email: registeredEmail || '', password: '' });
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      await load(localStorage.getItem('gsky_token'));
      show(tf(t.login.welcomeBack, { name: user.full_name }));
      navigate(user.role === 'ADMIN' ? '/admin' : from, { replace: true });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={t.seo.login} />
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900">{t.login.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.login.subtitle}</p>
          {registeredEmail && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              ✓ {tf(t.login.accountCreated, { email: registeredEmail })}
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">{t.login.email}</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">{t.login.password}</label>
              <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? <ButtonSpinner /> : t.login.login}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            {t.login.noAccount}{' '}
            <Link to="/register" className="font-bold text-orange-500 hover:underline">{t.login.createOne}</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
