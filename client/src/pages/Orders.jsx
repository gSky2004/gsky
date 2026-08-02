import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../services/gskyApi';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { SEO } from '../components/SEO';
import { formatTZS, orderStatusStyle } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const Orders = () => {
  const { t, statusLabel } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .mine()
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title={t.seo.orders} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 font-display text-3xl font-bold text-slate-900">{t.orders.title}</h1>
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title={t.orders.noOrders}
            description={t.orders.noOrdersDesc}
            action={<Link to="/shop" className="btn-primary">{t.orders.shopNow}</Link>}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="card block p-5 transition hover:shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-slate-900">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(o.order_status)}`}>{statusLabel(o.order_status)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(o.payment_status)}`}>{statusLabel(o.payment_status)}</span>
                  </div>
                  <p className="font-display font-bold text-orange-600">{formatTZS(o.total_amount)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;
