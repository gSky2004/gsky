import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/ui/EmptyState';
import { SEO } from '../components/SEO';
import { formatTZS } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const DELIVERY_FEE = 5000;

const Cart = () => {
  const { t } = useLanguage();
  const { items, subtotal, updateQty, remove, clear } = useCart();
  const { show } = useToast();
  const navigate = useNavigate();

  const total = subtotal + (items.length ? DELIVERY_FEE : 0);

  const handleQty = async (id, qty) => {
    try {
      await updateQty(id, qty);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const handleRemove = async (id) => {
    try {
      await remove(id);
      show(t.cart.itemRemoved, 'info');
    } catch (err) {
      show(err.message, 'error');
    }
  };

  if (items.length === 0) {
    return (
      <>
        <SEO title={t.seo.cart} />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h1 className="mb-8 font-display text-3xl font-bold text-slate-900">{t.cart.title}</h1>
          <EmptyState
            icon="🛒"
            title={t.cart.emptyTitle}
            description={t.cart.emptyDesc}
            action={<Link to="/shop" className="btn-primary">{t.common.shopNow}</Link>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={t.seo.cart} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 font-display text-3xl font-bold text-slate-900">{t.cart.title}</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="card flex gap-4 p-4"
                >
                  <Link to={`/products/${item.product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={item.product.main_image} alt={item.product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/products/${item.product.slug}`} className="font-display font-bold text-slate-900 hover:text-orange-500">
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-slate-500">{t.cart.size} {item.size}</p>
                      </div>
                      <p className="font-bold text-orange-600">{formatTZS(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1 rounded-lg border-2 border-slate-200 p-0.5">
                        <button onClick={() => handleQty(item.id, item.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-md font-bold hover:bg-slate-100">−</button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => handleQty(item.id, item.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-md font-bold hover:bg-slate-100">+</button>
                      </div>
                      <button onClick={() => handleRemove(item.id)} className="text-sm font-semibold text-red-500 hover:underline">
                        {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <button onClick={clear} className="text-sm font-semibold text-slate-500 hover:text-red-500">
              {t.cart.clearCart}
            </button>
          </div>

          <div className="card h-fit p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">{t.cart.orderSummary}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t.cart.subtotal}</span>
                <span>{formatTZS(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t.cart.deliveryFee}</span>
                <span>{formatTZS(DELIVERY_FEE)}</span>
              </div>
              <div className="my-3 border-t border-slate-100" />
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>{t.cart.total}</span>
                <span>{formatTZS(total)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary mt-6 w-full !py-4">
              {t.cart.checkout}
            </button>
            <Link to="/shop" className="mt-3 block text-center text-sm font-semibold text-slate-500 hover:text-orange-500">
              {t.cart.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
