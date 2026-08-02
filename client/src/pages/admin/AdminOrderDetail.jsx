import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../services/gskyApi';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { formatTZS, orderStatusStyle } from '../../utils/helpers';

const flow = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { show } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .order(id)
      .then((d) => setOrder(d.order))
      .finally(() => setLoading(false));
  }, [id]);

  const changeStatus = async (status) => {
    try {
      const { order: updated } = await adminApi.updateOrderStatus(id, status);
      setOrder((o) => ({ ...o, ...updated }));
      show(`Order marked as ${status}`);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  if (loading || !order) return <Spinner />;

  const next = flow[flow.indexOf(order.order_status) + 1];
  const canCancel = !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.order_status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/admin/orders" className="text-sm font-semibold text-slate-500 hover:text-orange-500">← Orders</Link>
      <h1 className="font-display text-2xl font-bold text-slate-900">{order.order_number}</h1>

      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(order.order_status)}`}>{order.order_status}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyle(order.payment_status)}`}>Payment: {order.payment_status}</span>
        {order.client_confirmed_at && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            ✓ Client confirmed delivery
          </span>
        )}
      </div>

      {order.order_status === 'DELIVERED' && !order.client_confirmed_at && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
          <span className="font-bold">Waiting for the client to confirm delivery.</span> Mark as COMPLETED once they confirm.
        </div>
      )}

      {next && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-slate-600">
            Move to <span className="font-bold text-slate-900">{next}</span>?
          </p>
          <div className="flex gap-2">
            <button onClick={() => changeStatus(next)} className="btn-primary !py-2 text-sm">
              Mark as {next}
            </button>
            {canCancel && (
              <button onClick={() => changeStatus('CANCELLED')} className="btn bg-red-500 !py-2 text-sm text-white hover:bg-red-600">
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900">Customer</h2>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{order.full_name}</span><br />
            {order.phone}<br />
            {order.email}
          </p>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-bold text-slate-800">Delivery Address</h3>
            <p className="mt-1 text-sm text-slate-600">
              {order.city}{order.area ? `, ${order.area}` : ''}{order.street ? `, ${order.street}` : ''}
            </p>
            {order.delivery_notes && <p className="mt-1 text-xs text-slate-400">Notes: {order.delivery_notes}</p>}
          </div>
          <p className="mt-4 text-xs text-slate-400">Ordered: {new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900">Summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatTZS(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Delivery fee</span><span>{formatTZS(order.delivery_fee)}</span></div>
            <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>{formatTZS(order.total_amount)}</span></div>
          </div>
          {order.payments?.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800">Payments</h3>
              {order.payments.map((p) => (
                <p key={p.id} className="mt-1 text-xs text-slate-500">
                  {p.payment_method} · {p.payment_reference} · <span className="font-bold">{p.status}</span>
                  {p.transaction_reference ? ` · ${p.transaction_reference}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto p-6">
        <h2 className="font-display font-bold text-slate-900">Items</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr><th className="py-2">Product</th><th>Size</th><th>Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-t border-slate-50">
                <td className="py-2 font-semibold text-slate-800">{i.product_name}</td>
                <td className="text-slate-500">{i.size}</td>
                <td className="text-slate-500">{i.quantity}</td>
                <td className="text-right text-slate-500">{formatTZS(i.price)}</td>
                <td className="text-right font-bold text-slate-800">{formatTZS(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
