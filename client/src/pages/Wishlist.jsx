import { useEffect, useState } from 'react';
import { wishlistApi } from '../services/gskyApi';
import { ProductCard } from '../components/ProductCard';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { SEO } from '../components/SEO';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const Wishlist = () => {
  const { t } = useLanguage();
  const { show } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    wishlistApi
      .mine()
      .then((d) => setProducts(d.products))
      .catch((e) => show(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <SEO title={t.seo.wishlist} />
      <div className="bg-slate-900 py-10 text-center">
        <h1 className="font-display text-3xl font-bold text-white">{t.wishlist.title}</h1>
        <p className="mt-2 text-slate-400">{t.wishlist.sub}</p>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <EmptyState icon="🤍" title={t.wishlist.emptyTitle} description={t.wishlist.emptyDesc} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Wishlist;
