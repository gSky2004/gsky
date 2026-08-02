import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { whatsappLink, DEFAULT_WHATSAPP_MSG } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

export const OurServices = () => {
  const { t } = useLanguage();
  const services = [
    { icon: '🛵', title: t.services.s1t, desc: t.services.s1d },
    { icon: '✅', title: t.services.s2t, desc: t.services.s2d },
    { icon: '💬', title: t.services.s3t, desc: t.services.s3d },
    { icon: '↔️', title: t.services.s4t, desc: t.services.s4d },
  ];

  return (
  <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10 text-center"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-orange-500">{t.services.label}</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">{t.services.title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-slate-500">
        {t.services.subtitle}
      </p>
    </motion.div>

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="group rounded-2xl bg-white p-6 shadow-card transition hover:shadow-lift"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-2xl transition group-hover:scale-110">
            {s.icon}
          </span>
          <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-10 flex flex-wrap items-center justify-center gap-3"
    >
      <Link to="/shop" className="btn-primary">{t.services.shopNow}</Link>
      <a href={whatsappLink(DEFAULT_WHATSAPP_MSG)} target="_blank" rel="noreferrer" className="btn bg-emerald-500 text-white hover:bg-emerald-600">
        {t.services.chatWhatsapp}
      </a>
    </motion.div>
  </section>
  );
};
