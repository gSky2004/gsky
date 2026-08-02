import { motion } from 'framer-motion';
import { whatsappLink, DEFAULT_WHATSAPP_MSG } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

export const OurTeam = () => {
  const { t } = useLanguage();
  const team = [
    { name: 'Godson S.', role: t.team.m1r, initials: 'GS', color: 'bg-orange-500', desc: t.team.m1d },
    { name: 'Gosha T.', role: t.team.m2r, initials: 'GT', color: 'bg-emerald-500', desc: t.team.m2d },
    { name: 'Sabina M.', role: t.team.m3r, initials: 'SM', color: 'bg-sky-500', desc: t.team.m3d },
  ];

  return (
  <section id="team" className="bg-white py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">{t.team.label}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">{t.team.title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          {t.team.subtitle}
        </p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center shadow-card transition hover:shadow-lift"
          >
            <span className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${m.color} text-2xl font-bold text-white transition group-hover:scale-105`}>
              {m.initials}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{m.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">{m.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{m.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center text-sm text-slate-500"
      >
        {t.team.cta}{' '}
        <a
          href={whatsappLink(DEFAULT_WHATSAPP_MSG)}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-orange-600 hover:underline"
        >
          {t.team.ctaLink}
        </a>
      </motion.p>
    </div>
  </section>
  );
};
