import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsApi, categoriesApi } from '../services/gskyApi';
import { API_URL } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { Newsletter } from '../components/Newsletter';
import { Testimonials } from '../components/Testimonials';
import { OurServices } from '../components/OurServices';
import { OurTeam } from '../components/OurTeam';
import { Spinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { whatsappLink, DEFAULT_WHATSAPP_MSG } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
  const { t } = useLanguage();
  return (
  <section className="relative overflow-hidden bg-slate-950 text-white">
    <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
    <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400"
        >
          👟 {t.hero.badge}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
        >
          {t.hero.title}
          <span className="mt-3 block text-2xl text-orange-500 sm:text-3xl">{t.hero.subtitle}</span>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Link to="/shop" className="btn-primary !px-8 !py-4 text-base">
            {t.hero.shopNow}
          </Link>
          <a href={whatsappLink(DEFAULT_WHATSAPP_MSG)} target="_blank" rel="noreferrer" className="btn bg-emerald-500 !px-8 !py-4 text-base text-white hover:bg-emerald-600">
            {t.hero.whatsapp}
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex gap-8 text-sm text-slate-400"
        >
          <div><p className="font-display text-2xl font-bold text-white">16+</p>{t.hero.styles}</div>
          <div><p className="font-display text-2xl font-bold text-white">5</p>{t.hero.categories}</div>
          <div><p className="font-display text-2xl font-bold text-white">100%</p>{t.hero.quality}</div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, duration: 0.7, type: 'spring', damping: 18 }}
        className="relative"
      >
        <div className="relative mx-auto max-w-md">
          <img src={`${API_URL}/uploads/02.webp`} alt="Gsky Predator FG football boot" className="w-full rounded-3xl object-cover shadow-lift" />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute -bottom-5 -left-5 rounded-2xl bg-white px-5 py-4 text-slate-900 shadow-lift"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">{t.hero.hot}</p>
            <p className="font-display text-sm font-bold">Gsky Predator FG</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
  );
};

const SectionHeader = ({ title, subtitle, to }) => {
  const { t } = useLanguage();
  return (
  <div className="mb-8 flex items-end justify-between">
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
    </div>
    {to && (
      <Link to={to} className="btn-ghost !px-4 !py-2 text-xs">
        {t.common.viewAll}
      </Link>
    )}
  </div>
  );
};

const Home = () => {
  const { t } = useLanguage();
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.list({ featured: 'true', limit: 8 }),
      productsApi.list({ best_seller: 'true', limit: 8 }),
      productsApi.list({ is_new: 'true', limit: 8 }),
      categoriesApi.list(),
    ])
      .then(([f, b, n, c]) => {
        setFeatured(f.products);
        setBestSellers(b.products);
        setNewArrivals(n.products);
        setCategories(c.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title={t.seo.home} />
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeader title={t.home.shopByCategory} to="/shop" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/shop?category=${c.id}`}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-6 text-center shadow-card transition hover:shadow-lift"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-2xl transition group-hover:scale-110">
                  👟
                </span>
                <span className="font-display text-sm font-bold text-slate-900">{c.name}</span>
                <span className="text-xs text-slate-400">{c.product_count} {t.home.products}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="new-arrivals" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader title={t.home.newArrivals} subtitle={t.home.newArrivalsSub} to="/shop?is_new=true" />
          {loading ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeader title={t.home.featuredCollection} subtitle={t.home.featuredSub} to="/shop?featured=true" />
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <OurServices />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <SectionHeader title={t.home.bestSellers} subtitle={t.home.bestSellersSub} to="/shop?best_seller=true" />
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <Testimonials />
      <OurTeam />
      <Newsletter />
    </>
  );
};

export default Home;
