import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../services/gskyApi';
import { Spinner } from '../../components/ui/Spinner';
import { DonutChart } from '../../components/charts/DonutChart';
import { BarChart, PALETTE } from '../../components/charts/BarChart';
import { formatTZS, orderStatusStyle } from '../../utils/helpers';

const StatCard = ({ label, value, icon, accent }) => (
  <div className="card flex items-center gap-4 p-5">
    <span className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${accent}`}>{icon}</span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-display text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const cardTitle = 'font-display font-bold text-slate-900';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.salesSeries()])
      .then(([s, ser]) => {
        setData(s);
        setSeries(ser.series);
      })
      .catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  const s = data.stats;

  const revenueByCategory = (data.categoryRevenue || []).map((c) => ({
    label: c.category,
    value: Number(c.revenue),
  }));

  const ordersByStatus = data.ordersByStatus || [];
  const maxStatus = Math.max(...ordersByStatus.map((o) => o.count), 1);
  const statusTotal = ordersByStatus.reduce((sum, o) => sum + o.count, 0);

  const monthlyRevenue = series.map((m) => ({ label: m.month.slice(5) + '/' + m.month.slice(2, 4), value: Number(m.revenue) }));
  const monthlyOrders = series.map((m) => ({ label: m.month.slice(5) + '/' + m.month.slice(2, 4), value: m.orders }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Sales" value={formatTZS(s.totalSales)} icon="💰" accent="bg-emerald-100" />
        <StatCard label="Total Orders" value={s.totalOrders} icon="📦" accent="bg-blue-100" />
        <StatCard label="Customers" value={s.totalCustomers} icon="👥" accent="bg-violet-100" />
        <StatCard label="Subscribers" value={s.newsletterSubscribers} icon="📧" accent="bg-amber-100" />
        <StatCard label="Pending Orders" value={s.pendingOrders} icon="⏳" accent="bg-orange-100" />
        <StatCard label="Low Stock" value={s.lowStock} icon="⚠️" accent="bg-red-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className={cardTitle}>Sales — last 6 months</h2>
          <div className="mt-4">
            <BarChart data={monthlyRevenue} formatValue={(n) => formatTZS(n)} color={PALETTE[0]} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className={cardTitle}>Revenue by Category</h2>
          <div className="mt-4">
            <DonutChart data={revenueByCategory} formatValue={(n) => formatTZS(n)} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className={cardTitle}>Orders — last 6 months</h2>
          <div className="mt-4">
            <BarChart data={monthlyOrders} color="#0ea5e9" />
          </div>
        </div>

        <div className="card p-6">
          <h2 className={cardTitle}>Orders by Status</h2>
          {ordersByStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No orders yet</p>
          ) : (
            <div className="mt-4 space-y-4">
              {ordersByStatus.map((o) => (
                <div key={o.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${orderStatusStyle(o.status)}`}>
                        {o.status}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {o.count} · {((o.count / maxStatus) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(o.count / maxStatus) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: o.status === 'CANCELLED' ? '#ef4444' : '#22c55e' }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400">Total: {statusTotal} orders</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className={cardTitle}>Best Selling Products</h2>
          <div className="mt-4 space-y-3">
            {data.bestSellers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 text-center font-display font-bold text-slate-400">{i + 1}</span>
                {p.main_image && <img src={p.main_image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{formatTZS(p.price)}</p>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className={cardTitle}>Recent Pending Orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-orange-500">View all</Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.pendingOrders.length === 0 && <p className="text-sm text-slate-400">No pending orders</p>}
            {data.pendingOrders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{o.order_number}</p>
                  <p className="text-xs text-slate-400">{o.full_name} · {o.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatTZS(o.total_amount)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${orderStatusStyle(o.payment_status)}`}>{o.payment_status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className={cardTitle}>Low Stock Products</h2>
          <Link to="/admin/products" className="text-sm font-semibold text-orange-500">Manage</Link>
        </div>
        <div className="mt-4 space-y-3">
          {data.lowStockProducts.length === 0 && <p className="text-sm text-slate-400">All products well stocked 👍</p>}
          {data.lowStockProducts.map((p) => (
            <Link key={p.id} to={`/admin/products/${p.id}`} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3">
              <div className="flex items-center gap-3">
                {p.main_image && <img src={p.main_image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
              </div>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">{p.total_stock} left</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
