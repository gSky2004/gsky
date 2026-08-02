import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const Stars = () => (
  <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
    {'★★★★★'.split('').map((s, i) => (
      <span key={i}>{s}</span>
    ))}
  </div>
);

export const Testimonials = () => {
  const { t } = useLanguage();
  const testimonials = [
    { name: 'Juma M.', role: t.testimonials.r1, quote: t.testimonials.q1, initials: 'JM', color: 'bg-orange-500' },
    { name: 'Neema R.', role: t.testimonials.r2, quote: t.testimonials.q2, initials: 'NR', color: 'bg-emerald-500' },
    { name: 'Baraka S.', role: t.testimonials.r3, quote: t.testimonials.q3, initials: 'BS', color: 'bg-sky-500' },
    { name: 'Amina K.', role: t.testimonials.r4, quote: t.testimonials.q4, initials: 'AK', color: 'bg-violet-500' },
    { name: 'David T.', role: t.testimonials.r5, quote: t.testimonials.q5, initials: 'DT', color: 'bg-rose-500' },
    { name: 'Zawadi L.', role: t.testimonials.r6, quote: t.testimonials.q6, initials: 'ZL', color: 'bg-amber-500' },
  ];
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(3);
  const timer = useRef(null);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setVisible(3);
      else if (window.innerWidth >= 640) setVisible(2);
      else setVisible(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pages = Math.max(1, testimonials.length - visible + 1);
  const clamped = index >= pages ? 0 : index;

  useEffect(() => {
    timer.current = setInterval(() => {
      setIndex((i) => (i >= pages - 1 ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(timer.current);
  }, [pages]);

  const go = (next) => {
    clearInterval(timer.current);
    setIndex(next < 0 ? pages - 1 : next % pages);
    timer.current = setInterval(() => {
      setIndex((i) => (i >= pages - 1 ? 0 : i + 1));
    }, 4000);
  };

  return (
    <section id="testimonials" className="relative overflow-hidden bg-slate-900 py-16 text-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400">{t.testimonials.label}</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{t.testimonials.title}</h2>
        </motion.div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${clamped * (100 / visible)}%)` }}
          >
            {testimonials.map((t) => (
              <div key={t.name} className="w-full shrink-0 px-2" style={{ flex: `0 0 ${100 / visible}%` }}>
                <div className="flex h-full flex-col gap-4 rounded-2xl bg-white/5 p-6 backdrop-blur-sm">
                  <Stars />
                  <p className="text-sm leading-relaxed text-slate-300">“{t.quote}”</p>
                  <div className="mt-auto flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-full ${t.color} text-sm font-bold text-white`}>
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={() => go(clamped - 1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-lg font-bold transition-colors hover:bg-orange-500"
            aria-label="Previous testimonials"
          >
            ←
          </button>
          <div className="flex gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to testimonial page ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === clamped ? 'w-7 bg-orange-500' : 'w-2.5 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => go(clamped + 1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-lg font-bold transition-colors hover:bg-orange-500"
            aria-label="Next testimonials"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
};
