import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ordersApi } from '../services/gskyApi';
import { SEO } from '../components/SEO';
import { ButtonSpinner } from '../components/ui/Spinner';
import { TrackTimeline } from '../components/TrackTimeline';
import { formatTZS, orderStatusStyle } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const TrackOrder = () => {
  const { t, tf, statusLabel } = useLanguage();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [orderNumber, setOrderNumber] = useState(params.get('orderNumber') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('orderNumber')) submit();
  }, []);

  const submit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const d = await ordersApi.track(email, orderNumber);
      setResult(d.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={t.seo.track} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className="text-4xl">🛵</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">{t.track.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.track.subtitle}
          </p>
        </div>

        <form onSubmit={submit} className="card mt-8 p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="label">{t.track.billingEmail}</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">{t.track.orderId}</label>
              <input
                className="input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="GSK-YYYYMMDD-XXXX"
                required
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 sm:w-auto">
                {loading ? <ButtonSpinner /> : t.track.track}
              </button>
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
        </form>

        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">{result.order_number}</h2>
                  <p className="text-sm text-slate-500">
                    {tf(t.track.placed, { name: result.full_name, date: new Date(result.created_at).toLocaleString() })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(result.order_status)}`}>{statusLabel(result.order_status)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(result.payment_status)}`}>{statusLabel(result.payment_status)}</span>
                </div>
              </div>
            </div>

            <TrackTimeline order={result} />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <h3 className="font-display font-bold text-slate-900">{t.track.deliveryAddress}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {result.full_name}<br />
                  {result.phone}<br />
                  {result.city}{result.area ? `, ${result.area}` : ''}{result.street ? `, ${result.street}` : ''}
                  {result.delivery_zone ? ` (${result.delivery_zone})` : ''}
                </p>
                {result.delivery_notes && <p className="mt-2 text-xs text-slate-400">{tf(t.track.notes, { notes: result.delivery_notes })}</p>}
              </div>
              <div className="card p-6">
                <h3 className="font-display font-bold text-slate-900">{t.track.items}</h3>
                <div className="mt-2 space-y-2">
                  {result.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{i.product_name} <span className="text-slate-400">{tf(t.track.sizeQty, { size: i.size, qty: i.quantity })}</span></span>
                      <span className="font-bold text-slate-800">{formatTZS(i.price * i.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-2 text-sm">
                    <div className="flex justify-between text-slate-600"><span>{t.track.deliveryFee}</span><span>{formatTZS(result.delivery_fee)}</span></div>
                    <div className="flex justify-between font-bold text-slate-900"><span>{t.track.total}</span><span>{formatTZS(result.total_amount)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default TrackOrder;
