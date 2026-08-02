import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ordersApi, paymentsApi } from '../services/gskyApi';
import { Spinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { useToast } from '../context/ToastContext';
import { formatTZS, orderStatusStyle } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const OrderDetail = () => {
  const { t, tf, statusLabel } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    ordersApi
      .get(id)
      .then((d) => setOrder(d.order))
      .catch((err) => {
        show(err.message, 'error');
        navigate('/orders');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const payNow = async () => {
    setPaying(true);
    try {
      const payment = await paymentsApi.create({ orderId: order.id, method: 'M-Pesa' });
      let tries = 0;
      const poll = async () => {
        const result = await paymentsApi.verify(payment.paymentReference);
        if (result.status === 'COMPLETED') {
          show(t.orderDetail.paymentSuccess);
          const d = await ordersApi.get(id);
          setOrder(d.order);
          setPaying(false);
          return;
        }
        tries += 1;
        if (tries < 10) setTimeout(poll, 1500);
        else {
          show(t.orderDetail.paymentProcessing, 'info');
          setPaying(false);
        }
      };
      setTimeout(poll, 3000);
    } catch (err) {
      show(err.message, 'error');
      setPaying(false);
    }
  };

  const confirmDelivery = async () => {
    setConfirming(true);
    try {
      const { order: updated } = await ordersApi.confirmDelivery(order.id);
      setOrder(updated);
      show(t.orderDetail.deliveryConfirmed);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading || !order) return <Spinner />;

  return (
    <>
      <SEO title={tf(t.seo.orderDetail, { number: order.order_number })} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/orders" className="text-sm font-semibold text-slate-500 hover:text-orange-500">{t.orderDetail.myOrders}</Link>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">{order.order_number}</h1>
            <p className="text-sm text-slate-500">{tf(t.orderDetail.placed, { date: new Date(order.created_at).toLocaleString() })}</p>
          </div>
          <div className="flex gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(order.order_status)}`}>{statusLabel(order.order_status)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(order.payment_status)}`}>{statusLabel(order.payment_status)}</span>
          </div>
        </div>

        {order.payment_status === 'PENDING' && order.order_status !== 'CANCELLED' && (
          <div className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-800">{t.orderDetail.notPaid}</p>
            <p className="text-sm text-amber-700">{t.orderDetail.completePayment}</p>
            <button onClick={payNow} disabled={paying} className="btn-primary mt-3">
              {paying ? t.orderDetail.processing : t.orderDetail.payNow}
            </button>
          </div>
        )}

        {order.order_status === 'DELIVERED' && (
          <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
            <p className="font-bold text-emerald-800">{t.orderDetail.delivered}</p>
            {order.client_confirmed_at ? (
              <p className="mt-1 text-sm text-emerald-700">
                {tf(t.orderDetail.youConfirmed, { date: new Date(order.client_confirmed_at).toLocaleString() })}
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-emerald-700">{t.orderDetail.received}</p>
                <button onClick={confirmDelivery} disabled={confirming} className="btn-primary mt-3">
                  {confirming ? t.orderDetail.confirming : t.orderDetail.confirmDelivery}
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display font-bold text-slate-900">{t.orderDetail.items}</h2>
            <div className="mt-3 space-y-3">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0">
                  {i.image_url && <img src={i.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{i.product_name}</p>
                    <p className="text-xs text-slate-500">{t.common.size} {i.size} × {i.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{formatTZS(i.price * i.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-600"><span>{t.orderDetail.subtotal}</span><span>{formatTZS(order.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>{t.orderDetail.deliveryFee}</span><span>{formatTZS(order.delivery_fee)}</span></div>
              <div className="flex justify-between font-bold text-slate-900"><span>{t.orderDetail.total}</span><span>{formatTZS(order.total_amount)}</span></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-display font-bold text-slate-900">{t.orderDetail.delivery}</h2>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{order.full_name}</span><br />
                {order.phone} · {order.email}<br />
                {order.city}{order.area ? `, ${order.area}` : ''}{order.street ? `, ${order.street}` : ''}
              </p>
              {order.delivery_notes && <p className="mt-2 text-sm text-slate-500">{tf(t.orderDetail.notes, { notes: order.delivery_notes })}</p>}
            </div>
            {order.payments?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display font-bold text-slate-900">{t.orderDetail.payments}</h2>
                <div className="mt-2 space-y-2 text-sm">
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="text-slate-500">{p.payment_method}</span>
                      <span className={`font-bold ${p.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>{statusLabel(p.status)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
