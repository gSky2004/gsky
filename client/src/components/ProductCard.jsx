import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatTZS } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';

export const ProductCard = ({ product, index = 0 }) => {
  const { t, tf } = useLanguage();
  const { user } = useAuth();
  const { add } = useCart();
  const { show } = useToast();
  const { isSaved, toggle } = useWishlist();
  const navigate = useNavigate();

  const saved = isSaved(product.id);
  const inStock = product.total_stock > 0;
  const firstAvailableSize = product.sizes?.find((s) => s.stock_quantity > 0);

  const quickAdd = async (e) => {
    e.preventDefault();
    if (!user) {
      show(t.productCard.loginToAdd, 'info');
      navigate('/login');
      return;
    }
    if (!firstAvailableSize) {
      show(t.productCard.outOfStockMsg, 'error');
      return;
    }
    try {
      await add({ productId: product.id, size: firstAvailableSize.size, quantity: 1 });
      show(t.productCard.added);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.4) }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-lift"
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <img
            src={product.main_image || '/placeholder.svg'}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                {t.productCard.new}
              </span>
            )}
            {product.is_best_seller && (
              <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                {t.productCard.bestSeller}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(product.id);
            }}
            aria-label="Save to wishlist"
            className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-card transition ${
              saved ? 'bg-orange-500 text-white' : 'bg-white/90 text-slate-400 hover:text-orange-500'
            }`}
          >
            {saved ? '♥' : '♡'}
          </button>
          {!inStock && (
            <div className="absolute inset-0 grid place-items-center bg-white/70">
              <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase text-white">
                {t.productCard.outOfStock}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {product.category_name || 'Shoes'}
          </p>
          <h3 className="mt-1 font-display text-base font-bold text-slate-900">{product.name}</h3>
          <p className="mt-1 text-sm font-bold text-orange-600">{formatTZS(product.price)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {product.sizes?.length
              ? tf(t.productCard.sizes, { sizes: product.sizes.map((s) => s.size).join(' · ') })
              : t.productCard.noSizes}
          </p>
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-2 p-4 pt-0">
        <button onClick={quickAdd} className="btn-primary !py-2.5 text-xs" disabled={!inStock}>
          {t.productCard.addToCart}
        </button>
        <Link
          to={`/products/${product.slug}`}
          className="btn-outline !py-2.5 text-xs"
        >
          {t.productCard.view}
        </Link>
      </div>
    </motion.div>
  );
};
