import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../services/gskyApi';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatTZS } from '../../utils/helpers';
import { Modal } from '../../components/ui/Modal';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    productsApi
      .list({ limit: 100 })
      .then((d) => setProducts(d.products))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = q ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : products;

  const handleDelete = async () => {
    try {
      await productsApi.remove(confirm.id);
      show('Product deleted');
      setConfirm(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-slate-900">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      <input className="input max-w-xs" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="👟" title="No products" description="Add your first product." action={<Link to="/admin/products/new" className="btn-primary">Add Product</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.main_image && <img src={p.main_image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                      <span className="font-semibold text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.category_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatTZS(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.total_stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {p.total_stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.is_featured && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">FEATURED</span>}
                      {p.is_new && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                      {p.is_best_seller && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">BEST</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/products/${p.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">Edit</Link>
                      <button onClick={() => setConfirm(p)} className="btn-ghost !px-3 !py-1.5 text-xs text-red-500">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete product">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <span className="font-bold">{confirm?.name}</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirm(null)} className="btn-ghost">Cancel</button>
          <button onClick={handleDelete} className="btn bg-red-500 text-white hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;
