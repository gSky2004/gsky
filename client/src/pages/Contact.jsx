import { useState } from 'react';
import { SEO } from '../components/SEO';
import { whatsappLink, DEFAULT_WHATSAPP_MSG } from '../utils/helpers';
import { contactApi } from '../services/gskyApi';
import { ButtonSpinner } from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const channels = [
    { name: 'WhatsApp', value: '0675029833', href: whatsappLink(DEFAULT_WHATSAPP_MSG), icon: '💬', note: t.contact.noteWhatsapp },
    { name: 'Email', value: 'gskyshoes@gmail.com', href: 'mailto:gskyshoes@gmail.com', icon: '✉️', note: t.contact.noteEmail },
    { name: 'Instagram', value: '@gskyshoes', href: '#', icon: '📸', note: t.contact.noteInstagram },
    { name: 'TikTok', value: '@gskyshoes', href: '#', icon: '🎵', note: t.contact.noteTiktok },
    { name: 'Facebook', value: 'Gsky Sport Shoes', href: '#', icon: '👍', note: t.contact.noteFacebook },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await contactApi.submit(form);
      show(res.message);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO title={t.seo.contact} />
      <div className="bg-slate-900 py-12 text-center">
        <h1 className="font-display text-3xl font-bold text-white">{t.contact.title}</h1>
        <p className="mt-2 text-slate-400">{t.contact.subtitle}</p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="card mb-8 overflow-hidden">
          <div className="bg-slate-900 px-6 py-6 text-white">
            <h2 className="font-display text-xl font-bold">{t.contact.visitStore}</h2>
            <p className="mt-1 text-sm text-slate-300">{t.contact.storeLine}</p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-3">
            <div>
              <p className="label">{t.contact.address}</p>
              <p className="text-sm text-slate-600">Gsky Sport Shoes<br />DIT, Morogoro Road<br />Dar es Salaam, Tanzania</p>
            </div>
            <div>
              <p className="label">{t.contact.whatsapp}</p>
              <a href={whatsappLink(DEFAULT_WHATSAPP_MSG)} target="_blank" rel="noreferrer" className="text-sm font-bold text-emerald-600 hover:underline">
                0675029833
              </a>
            </div>
            <div>
              <p className="label">{t.contact.hours}</p>
              <p className="text-sm whitespace-pre-line text-slate-600">{t.contact.hoursLine}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="card p-6 lg:col-span-3">
            <h2 className="font-display text-lg font-bold text-slate-900">{t.contact.sendMessage}</h2>
            <p className="mt-1 text-sm text-slate-400">{t.contact.reply}</p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">{t.contact.yourName}</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Asha Kamara" />
                </div>
                <div>
                  <label className="label">{t.contact.yourEmail}</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">{t.contact.subject}</label>
                <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder={t.contact.subjectPh} />
              </div>
              <div>
                <label className="label">{t.contact.message}</label>
                <textarea className="input min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required placeholder={t.contact.messagePh} />
              </div>
              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? <ButtonSpinner /> : t.contact.send}
              </button>
            </form>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {channels.map((c) => (
              <a
                key={c.name}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="card group p-6 transition hover:shadow-lift"
              >
                <span className="text-3xl">{c.icon}</span>
                <h3 className="mt-3 font-display font-bold text-slate-900 group-hover:text-orange-500">{c.name}</h3>
                <p className="text-sm font-semibold text-slate-600">{c.value}</p>
                <p className="mt-1 text-xs text-slate-400">{c.note}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
