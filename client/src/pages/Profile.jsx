import { useState } from 'react';
import { auth } from '../services/gskyApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ButtonSpinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { t, tf } = useLanguage();
  const { user, setUser } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user: updated } = await auth.updateProfile(form);
      setUser(updated);
      localStorage.setItem('gsky_user', JSON.stringify(updated));
      show(t.profile.updated);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={t.seo.profile} />
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 font-display text-3xl font-bold text-slate-900">{t.profile.title}</h1>
        <div className="card p-6">
          <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-slate-800">{user.full_name}</p>
            <p className="text-slate-500">{user.email} · {user.phone}</p>
            <p className="mt-1 text-xs text-slate-400">{tf(t.profile.memberSince, { date: new Date(user.created_at).toLocaleDateString() })}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t.profile.fullName}</label>
              <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t.profile.phoneNumber}</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t.profile.emailCannotChange}</label>
              <input className="input" value={user.email} disabled />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <ButtonSpinner /> : t.profile.save}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
