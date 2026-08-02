import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  const values = [
    { icon: '⚡', title: t.about.v1t, text: t.about.v1d },
    { icon: '💰', title: t.about.v2t, text: t.about.v2d },
    { icon: '🤝', title: t.about.v3t, text: t.about.v3d },
    { icon: '🚚', title: t.about.v4t, text: t.about.v4d },
  ];

  return (
  <>
    <SEO title={t.seo.about} />
    <div className="bg-slate-900 py-12 text-center">
      <h1 className="font-display text-3xl font-bold text-white">{t.about.title}</h1>
      <p className="mt-2 text-slate-400">{t.about.subtitle}</p>
    </div>

    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="font-display text-2xl font-bold text-slate-900">{t.about.whoWeAre}</h2>
        <p className="mt-4 leading-relaxed text-slate-600">
          {t.about.p1}
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          {t.about.p2}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12">
        <h2 className="font-display text-2xl font-bold text-slate-900">{t.about.standFor}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="card p-6">
              <span className="text-3xl">{v.icon}</span>
              <h3 className="mt-3 font-display font-bold text-slate-900">{v.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{v.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-12 rounded-2xl bg-slate-900 p-8 text-center text-white">
        <h2 className="font-display text-xl font-bold">{t.about.ready}</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/shop" className="btn-primary">{t.about.shopNow}</Link>
          <a href="https://wa.me/255675029833" target="_blank" rel="noreferrer" className="btn bg-emerald-500 text-white hover:bg-emerald-600">
            {t.about.whatsappUs}
          </a>
        </div>
      </div>
    </div>
  </>
  );
};

export default About;
