import { useEffect, useState } from 'react';
import { adminApi } from '../../services/gskyApi';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatTZS } from '../../utils/helpers';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.customers().then((d) => {
      setCustomers(d.customers.filter((c) => c.role === 'CLIENT'));
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Customers</h1>
      {customers.length === 0 ? (
        <EmptyState icon="👥" title="No customers yet" description="Registered clients will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.full_name}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-600">{c.email}</p>
                    <p className="text-xs text-slate-400">{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{c.order_count}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{formatTZS(c.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
