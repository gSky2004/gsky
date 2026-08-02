import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsApi, reviewsApi } from '../services/gskyApi';
import { Spinner } from '../components/ui/Spinner';
import { RatingStars } from '../components/ui/RatingStars';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatTZS, whatsappLink } from '../utils/helpers';
import { ButtonSpinner } from '../components/ui/Spinner';
import { useLanguage } from '../context/LanguageContext';

const ProductDetail = () => {
  const { t, tf } = useLanguage();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const { show } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsApi
      .get(slug)
      .then(({ product }) => {
        setProduct(product);
        const available = product.sizes.find((s) => s.stock_quantity > 0);
        setSize(available ? available.size : '');
        document.title = `${product.name} — Gsky Sport Shoes`;
        return reviewsApi.list(product.id);
      })
      .then((r) => setReviews(r.reviews))
      .catch((err) => {
        if (err.message === 'Product not found') {
          show(t.product.productNotFound, 'error');
          navigate('/shop');
        }
      })
      .finally(() => setLoading(false));
  }, [slug, navigate, show, t.product.productNotFound]);

  if (loading || !product) return <Spinner />;

  const images = [product.main_image, ...(product.images || [])].filter(Boolean);
  const sizeStock = (s) => product.sizes.find((x) => x.size === s)?.stock_quantity || 0;
  const selectedSize = sizeStock(size);
  const inStock = selectedSize > 0;

  const handleAddToCart = async () => {
    if (!user) {
      show(t.product.pleaseLoginCart, 'info');
      navigate('/login');
      return;
    }
    if (!size) {
      show(t.product.pleaseSelectSize, 'error');
      return;
    }
    setAdding(true);
    try {
      await add({ productId: product.id, size, quantity: qty });
      show(t.product.addedToCart);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    if (!user) {
      show(t.product.pleaseLoginCheckout, 'info');
      navigate('/login');
      return;
    }
    if (!size) {
      show(t.product.pleaseSelectSize, 'error');
      return;
    }
    await handleAddToCart();
    navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewing(true);
    try {
      const fd = new FormData();
      fd.append('rating', rating);
      fd.append('comment', comment);
      if (reviewImage) fd.append('image', reviewImage);
      const { review } = await reviewsApi.create(product.id, fd);
      show(t.product.thanksReview);
      setComment('');
      setReviewImage(null);
      const r = await reviewsApi.list(product.id);
      setReviews(r.reviews);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setReviewing(false);
    }
  };

  const whatsappProduct = whatsappLink(
    `Hello Gsky Sport Shoes 👋 I'm interested in ${product.name}, size ${size || '?'}.`
  );

  return (
    <>
      <SEO title={tf(t.seo.product, { name: product.name })} description={product.description} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-xs text-slate-500">
          <Link to="/" className="hover:text-orange-500">{t.product.home}</Link> /{' '}
          <Link to="/shop" className="hover:text-orange-500">{t.product.shop}</Link> /{' '}
          <span className="font-semibold text-slate-800">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square overflow-hidden rounded-3xl bg-slate-100">
              <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                      i === activeImage ? 'border-orange-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex flex-wrap gap-2">
              {product.is_new && <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase text-white">{t.product.newArrival}</span>}
              {product.is_best_seller && <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase text-white">{t.product.bestSeller}</span>}
              {product.is_featured && <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase text-white">{t.product.featured}</span>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{product.category_name}</p>
            <p className="mt-3 font-display text-3xl font-bold text-orange-600">{formatTZS(product.price)}</p>

            <p className="mt-5 leading-relaxed text-slate-600">{product.description}</p>

            <div className="mt-7">
              <p className="label">{t.product.selectSize}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const stock = s.stock_quantity;
                  return (
                    <button
                      key={s.size}
                      disabled={stock <= 0}
                      onClick={() => setSize(s.size)}
                      className={`min-w-[3rem] rounded-xl border-2 px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                        size === s.size
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
              {size && (
                <p className={`mt-2 text-sm ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                  {inStock ? tf(t.product.inStock, { n: selectedSize }) : t.product.outOfStock}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="label">{t.product.sizeGuide}</p>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl bg-white p-2 shadow-sm"><p className="font-bold text-slate-800">{t.product.us}</p><p className="text-slate-500">6 · 7</p></div>
                <div className="rounded-xl bg-white p-2 shadow-sm"><p className="font-bold text-slate-800">EU</p><p className="text-slate-500">39 · 40</p></div>
                <div className="rounded-xl bg-white p-2 shadow-sm"><p className="font-bold text-slate-800">{t.product.uk}</p><p className="text-slate-500">5.5 · 6.5</p></div>
                <div className="rounded-xl bg-white p-2 shadow-sm"><p className="font-bold text-slate-800">{t.product.footCm}</p><p className="text-slate-500">24.5 · 25.5</p></div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {t.product.sizeGuideHelp}
              </p>
            </div>

            <div className="mt-6">
              <p className="label">{t.product.quantity}</p>
              <div className="flex w-fit items-center gap-1 rounded-xl border-2 border-slate-200 p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-10 w-10 place-items-center rounded-lg text-lg font-bold hover:bg-slate-100">−</button>
                <span className="w-10 text-center text-lg font-bold">{qty}</span>
                <button onClick={() => setQty(Math.min(selectedSize || qty, qty + 1))} className="grid h-10 w-10 place-items-center rounded-lg text-lg font-bold hover:bg-slate-100">+</button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button onClick={handleAddToCart} disabled={!inStock || adding} className="btn-primary !py-4 text-base">
                {adding ? <ButtonSpinner /> : t.product.addToCart}
              </button>
              <button onClick={buyNow} disabled={!inStock} className="btn-dark !py-4 text-base">
                {t.product.buyNow}
              </button>
              <a href={whatsappProduct} target="_blank" rel="noreferrer" className="btn bg-emerald-500 !py-4 text-base text-white hover:bg-emerald-600 sm:col-span-2">
                {t.product.whatsappProduct}
              </a>
            </div>
          </motion.div>
        </div>

        <section className="mt-16 grid gap-8 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-display text-xl font-bold text-slate-900">{tf(t.product.customerReviews, { n: reviews.length })}</h2>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">{t.product.noReviews}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{r.full_name}</p>
                      <RatingStars value={r.rating} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={t.product.customerPhoto}
                        className="mt-3 h-40 w-40 rounded-2xl object-cover shadow-card"
                      />
                    )}
                    <p className="mt-1 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="card h-fit p-6">
              <h2 className="font-display text-xl font-bold text-slate-900">{t.product.writeReview}</h2>
              <form onSubmit={submitReview} className="mt-4">
                <p className="label">{t.product.rating}</p>
                <RatingStars value={rating} onChange={setRating} />
                <p className="label mt-4">{t.product.yourComment}</p>
                <textarea className="input min-h-[100px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.product.commentPh} required />
                <p className="label mt-4">{t.product.addPhoto}</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReviewImage(e.target.files[0] || null)}
                  className="input cursor-pointer py-2 text-sm"
                />
                {reviewImage && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                    <img src={URL.createObjectURL(reviewImage)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    {t.product.photoAttached}
                  </div>
                )}
                <button type="submit" disabled={reviewing} className="btn-primary mt-4 w-full">
                  {reviewing ? <ButtonSpinner /> : t.product.submitReview}
                </button>
              </form>
            </div>
          ) : (
            <div className="card h-fit p-6">
              <p className="text-sm text-slate-600">
                <Link to="/login" className="font-bold text-orange-500">{t.common.login}</Link> {t.product.loginToReview}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default ProductDetail;
