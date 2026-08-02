import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ordersApi, paymentsApi, deliveryZonesApi, promosApi } from '../services/gskyApi';
import { EmptyState } from '../components/ui/EmptyState';
import { ButtonSpinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { formatTZS } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const FALLBACK_FEE = 5000;

const Checkout = () => {
  const { t, tf } = useLanguage();
  const { items, subtotal, load } = useCart();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: 'Dar es Salaam',
    area: '',
    street: '',
    delivery_notes: '',
  });
  const [order, setOrder] = useState(null);
  const [paymentRef, setPaymentRef] = useState(null);
  const [method, setMethod] = useState('M-Pesa');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paid, setPaid] = useState(false);
  const [zones, setZones] = useState([]);
  const [fee, setFee] = useState(FALLBACK_FEE);
  const [orderTotal, setOrderTotal] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => {
    let active = true;
    deliveryZonesApi
      .list()
      .then((d) => {
        if (!active) return;
        const zs = d.zones || [];
        setZones(zs);
        const def = zs.find((z) => z.is_default) || zs[0];
        if (def) {
          setFee(Number(def.price));
          setDelivery((prev) => ({ ...prev, area: prev.area || def.name, zone: prev.zone || def.name }));
        }
      })
      .catch(() => {
        if (active) setFee(FALLBACK_FEE);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectZone = (z) => {
    setDelivery({ ...delivery, area: z.name, zone: z.name });
    setFee(Number(z.price));
  };

  const set = (k) => (e) => setDelivery({ ...delivery, [k]: e.target.value });

  const methods = [
    { id: 'M-Pesa', label: 'M-Pesa', icon: '📱', note: 'Vodacom Mobile Money' },
    { id: 'Tigo Pesa', label: 'Tigo Pesa', icon: '📱', note: 'Tigo Mobile Money' },
    { id: 'Airtel Money', label: 'Airtel Money', icon: '📱', note: 'Airtel Mobile Money' },
    { id: 'Card', label: t.checkout.cardPayment, icon: '💳', note: t.checkout.cardNote },
  ];

  if (items.length === 0 && step === 1) {
    return (
      <>
        <SEO title={t.seo.checkout} />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <EmptyState
            icon="🛒"
            title={t.checkout.emptyTitle}
            description={t.checkout.emptyDesc}
            action={<Link to="/shop" className="btn-primary">{t.common.shopNow}</Link>}
          />
        </div>
      </>
    );
  }

  const total = subtotal + fee;
  const discount = promo
    ? promo.discount_type === 'percent'
      ? Math.min((promo.value / 100) * subtotal, subtotal)
      : Math.min(promo.value, subtotal)
    : 0;
  const displayTotal = orderTotal != null ? orderTotal : Math.max(0, subtotal - discount) + fee;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoError('');
    try {
      const { promo: p } = await promosApi.valid(promoCode);
      if (subtotal < Number(p.min_order)) {
        setPromoError(tf(t.checkout.minOrder, { amount: formatTZS(Number(p.min_order)) }));
        return;
      }
      setPromo(p);
      show(tf(t.checkout.promoAppliedMsg, { code: p.code }));
    } catch (err) {
      setPromo(null);
      setPromoError(err.message);
    } finally {
      setApplyingPromo(false);
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        delivery: { ...delivery, zone: delivery.zone || delivery.area },
        items: items.map((i) => ({
          productId: i.product.id,
          size: i.size,
          quantity: i.quantity,
        })),
        promoCode: promo ? promo.code : undefined,
      };
      const data = await ordersApi.create(payload);
      setOrder(data.order);
      setOrderTotal(Number(data.order.total_amount));
      setStep(2);
      await load(localStorage.getItem('gsky_token'));
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    setProcessingPayment(true);
    try {
      const payment = await paymentsApi.create({ orderId: order.id, method });
      setPaymentRef(payment.paymentReference);

      let tries = 0;
      const poll = async () => {
        const result = await paymentsApi.verify(payment.paymentReference);
        if (result.status === 'COMPLETED') {
          setPaid(true);
          setStep(3);
          return;
        }
        if (result.status === 'FAILED') {
          show(t.checkout.paymentFailed, 'error');
          setStep(2);
          setPaymentRef(null);
          return;
        }
        tries += 1;
        if (tries < 12) {
          setTimeout(poll, 1500);
        } else {
          show(t.checkout.paymentProcessing, 'info');
          navigate(`/orders/${order.id}`);
        }
      };
      setTimeout(poll, 3000);
    } catch (err) {
      show(err.message, 'error');
      setProcessingPayment(false);
    }
  };

  return (
    <>
      <SEO title={t.seo.checkout} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          {[t.checkout.stepDelivery, t.checkout.stepPayment, t.checkout.stepDone].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {done ? '✓' : n}
                </span>
                <span className={`hidden text-sm font-semibold sm:inline ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                {n < 3 && <span className="h-px w-6 bg-slate-300" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="delivery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <form onSubmit={placeOrder} className="card p-6">
                <h2 className="font-display text-xl font-bold text-slate-900">{t.checkout.deliveryDetails}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">{t.checkout.fullName}</label>
                    <input className="input" value={delivery.full_name} onChange={set('full_name')} required />
                  </div>
                  <div>
                    <label className="label">{t.checkout.phoneNumber}</label>
                    <input className="input" type="tel" value={delivery.phone} onChange={set('phone')} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{t.checkout.email}</label>
                    <input className="input" type="email" value={delivery.email} onChange={set('email')} required />
                  </div>
                  <div>
                    <label className="label">{t.checkout.city}</label>
                    <input className="input" value={delivery.city} onChange={set('city')} required />
                  </div>
                  <div>
                    <label className="label">{t.checkout.deliveryLocation}</label>
                    {zones.length > 0 ? (
                      <select
                        className="input"
                        value={delivery.zone || delivery.area}
                        onChange={(e) => {
                          const z = zones.find((x) => x.name === e.target.value);
                          if (z) selectZone(z);
                        }}
                        required
                      >
                        <option value="" disabled>{t.checkout.selectLocation}</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.name}>
                            {z.name} — {formatTZS(z.price)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input className="input" value={delivery.area} onChange={set('area')} placeholder="e.g. Morogoro Road" required />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{t.checkout.street}</label>
                    <input className="input" value={delivery.street} onChange={set('street')} placeholder={t.checkout.streetPh} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{t.checkout.deliveryNotes}</label>
                    <textarea className="input min-h-[80px]" value={delivery.delivery_notes} onChange={set('delivery_notes')} placeholder={t.checkout.notesPh} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary mt-6 w-full !py-4">
                  {loading ? <ButtonSpinner /> : t.checkout.continueToPayment}
                </button>
              </form>

              <div className="card h-fit p-6">
                <h3 className="font-display font-bold text-slate-900">{t.checkout.orderSummary}</h3>
                <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3">
                      <img src={i.product.main_image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{i.product.name}</p>
                        <p className="text-xs text-slate-500">{t.common.size} {i.size} × {i.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{formatTZS(i.price * i.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between text-slate-600"><span>{t.cart.subtotal}</span><span>{formatTZS(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-600">
                    <span>{tf(t.checkout.deliveryLabel, { zone: delivery.zone || delivery.area || t.checkout.yourLocation })}</span>
                    <span>{formatTZS(fee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-semibold text-emerald-600">
                      <span>{tf(t.checkout.discount, { code: promo?.code })}</span>
                      <span>−{formatTZS(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-slate-900"><span>{t.checkout.orderSummary}</span><span>{formatTZS(displayTotal)}</span></div>
                  <div className="pt-2">
                    {promo ? (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <span>{tf(t.checkout.promoApplied, { code: promo.code })}</span>
                        <button type="button" onClick={() => { setPromo(null); setPromoCode(''); }} className="font-bold hover:underline">{t.checkout.remove}</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input className="input uppercase" placeholder={t.checkout.promoCode} value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                        <button type="button" onClick={applyPromo} disabled={applyingPromo || !promoCode.trim()} className="btn-outline !px-4">
                          {applyingPromo ? '…' : t.checkout.apply}
                        </button>
                      </div>
                    )}
                    {promoError && <p className="mt-1 text-xs font-semibold text-red-500">{promoError}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="card mx-auto max-w-lg p-6">
              <h2 className="font-display text-xl font-bold text-slate-900">{t.checkout.choosePayment}</h2>
              <p className="mt-1 text-sm text-slate-500">{tf(t.checkout.orderLine, { number: order.order_number, total: formatTZS(displayTotal) })}</p>
              <div className="mt-5 space-y-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                      method === m.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="flex-1">
                      <span className="block font-bold text-slate-900">{m.label}</span>
                      <span className="block text-xs text-slate-500">{m.note}</span>
                    </span>
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${method === m.id ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                      {method === m.id && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                ))}
              </div>

              {paymentRef ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-600">{t.checkout.processingPayment}</p>
                  <p className="mt-1 text-xs text-slate-400">{tf(t.checkout.reference, { ref: paymentRef })}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {t.checkout.simulated}
                  </p>
                  <div className="mx-auto mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-full animate-pulse rounded-full bg-orange-500" />
                  </div>
                </div>
              ) : (
                <button onClick={pay} disabled={processingPayment} className="btn-primary mt-6 w-full !py-4">
                  {processingPayment ? <ButtonSpinner /> : tf(t.checkout.pay, { amount: formatTZS(displayTotal) })}
                </button>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-lg p-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-4xl">
                ✓
              </motion.div>
              <h2 className="mt-6 font-display text-2xl font-bold text-slate-900">{t.checkout.paymentSuccess}</h2>
              <p className="mt-2 text-slate-600">
                {tf(t.checkout.orderPaid, { number: order.order_number })}
              </p>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-sm">
                <p className="font-bold text-slate-800">{tf(t.checkout.orderLine, { number: order.order_number, total: formatTZS(displayTotal) })}</p>
                <p className="mt-1 text-slate-600">{t.checkout.totalPaid}: <span className="font-bold">{formatTZS(displayTotal)}</span></p>
                <p className="text-slate-600">{t.checkout.payment}: {method}</p>
                <p className="mt-1 text-xs text-slate-400">{tf(t.checkout.weContact, { phone: delivery.phone })}</p>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Link to={`/orders/${order.id}`} className="btn-primary">{t.checkout.viewOrder}</Link>
                <Link to="/shop" className="btn-outline">{t.checkout.continueShopping}</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Checkout;
