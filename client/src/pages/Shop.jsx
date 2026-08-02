import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../services/gskyApi';
import { ProductCard } from '../components/ProductCard';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const Shop = () => {
  const { t, tf } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const size = params.get('size') || '';
  const sort = params.get('sort') || 'newest';
  const featured = params.get('featured');
  const isNew = params.get('is_new');
  const bestSeller = params.get('best_seller');

  useEffect(() => {
    categoriesApi.list().then((c) => setCategories(c.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const query = { limit: 12, page: 1, sort };
    if (q) query.q = q;
    if (category) query.category = category;
    if (size) query.size = size;
    if (featured) query.featured = featured;
    if (isNew) query.is_new = isNew;
    if (bestSeller) query.best_seller = bestSeller;
    productsApi
      .list(query)
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, size, sort, featured, isNew, bestSeller]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const loadMore = () => {
    const next = page + 1;
    const query = { limit: 12, page: next, sort };
    if (q) query.q = q;
    if (category) query.category = category;
    if (size) query.size = size;
    if (featured) query.featured = featured;
    if (isNew) query.is_new = isNew;
    if (bestSeller) query.best_seller = bestSeller;
    productsApi.list(query).then((data) => {
      setProducts((prev) => [...prev, ...data.products]);
      setPage(next);
    });
  };

  return (
    <>
      <SEO title={t.seo.shop} />
      <div className="bg-slate-900 py-10 text-center">
        <h1 className="font-display text-3xl font-bold text-white">{t.shop.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{tf(t.shop.productsAvailable, { n: total })}</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-card md:grid-cols-[1fr_200px_160px_180px]">
          <input
            className="input"
            placeholder={t.shop.searchPh}
            value={q}
            onChange={(e) => update('q', e.target.value)}
          />
          <select className="input" value={category} onChange={(e) => update('category', e.target.value)}>
            <option value="">{t.shop.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="input" value={size} onChange={(e) => update('size', e.target.value)}>
            <option value="">{t.shop.allSizes}</option>
            {[39, 40, 41, 42, 43, 44].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="input" value={sort} onChange={(e) => update('sort', e.target.value)}>
            <option value="newest">{t.shop.sortNewest}</option>
            <option value="price_asc">{t.shop.sortPriceAsc}</option>
            <option value="price_desc">{t.shop.sortPriceDesc}</option>
            <option value="best_sellers">{t.shop.sortBestSellers}</option>
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="👟"
              title={t.shop.noShoesFound}
              description={t.shop.noShoesDesc}
              action={<button className="btn-primary" onClick={() => setParams({})}>{t.shop.clearFilters}</button>}
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
            {products.length < total && (
              <div className="mt-10 text-center">
                <button onClick={loadMore} className="btn-dark">
                  {t.shop.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Shop;
