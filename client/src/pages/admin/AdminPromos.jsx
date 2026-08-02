import { useEffect, useState } from 'react';
import { adminPromosApi } from '../../services/gskyApi';
import { Spinner, ButtonSpinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const empty = { code: '', discount_type: 'percent', value: '', min_order: 0, max_uses: 0, active: true };

const AdminPromos = () => {
  const { show } = useToast();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminPromosApi
      .list()
      .then((d) => {
        setPromos(d.promos);
        setLoading(false);
      })
      .catch((e) => show(e.message, 'error'));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({ code: p.code, discount_type: p.discount_type, value: p.value, min_order: p.min_order, max_uses: p.max_uses, active: p.active });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await adminPromosApi.update(editId, form);
      else await adminPromosApi.create(form);
      show(editId ? 'Promo updated' : 'Promo created');
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete promo code "${p.code}"?`)) return;
    try {
      await adminPromosApi.remove(p.id);
      show('Promo deleted');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  if (loading) return <Spinner />;

  const discountLabel = (p) =>
    p.discount_type === 'percent' ? `${Number(p.value)}% off` : `TZS ${Number(p.value).toLocaleString('en-US')} off`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Promo Codes</h1>

      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900">{editId ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
        <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Code</label>
            <input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="GSKY10" />
          </div>
          <div>
            <label className="label">Discount type</label>
            <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (TZS)</option>
            </select>
          </div>
          <div>
            <label className="label">{form.discount_type === 'percent' ? 'Percent off' : 'Amount off (TZS)'}</label>
            <input type="number" min="1" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
          </div>
          <div>
            <label className="label">Min order (TZS, 0 = none)</label>
            <input type="number" min="0" className="input" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
          </div>
          <div>
            <label className="label">Max uses (0 = unlimited)</label>
            <input type="number" min="0" className="input" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 pb-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
              Active
            </label>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <ButtonSpinner /> : editId ? 'Save' : 'Create'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {promos.length === 0 ? (
        <EmptyState icon="🏷️" title="No promo codes yet" description="Create your first discount code above." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-slate-900">{p.code}</p>
                  <p className="mt-1 text-sm font-semibold text-orange-600">{discountLabel(p)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {p.active ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Min order {Number(p.min_order).toLocaleString('en-US')} TZS · Used {p.used_count}
                {p.max_uses > 0 ? ` / ${p.max_uses}` : ''} · {p.expires_at ? `Expires ${new Date(p.expires_at).toLocaleDateString()}` : 'No expiry'}
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => startEdit(p)} className="btn-outline !px-3 !py-1.5 text-xs">Edit</button>
                <button onClick={() => remove(p)} className="btn-ghost !px-3 !py-1.5 text-xs text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromos;
