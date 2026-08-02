import { useEffect, useState } from 'react';
import { adminApi } from '../../services/gskyApi';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { formatTZS } from '../../utils/helpers';

const empty = { name: '', price: '5000', is_default: false };

const AdminDelivery = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const load = () => {
    adminApi.deliveryZones().then((d) => {
      setZones(d.zones);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(empty);
    setEditing({ mode: 'create' });
  };

  const openEdit = (z) => {
    setForm({ name: z.name, price: String(Number(z.price)), is_default: z.is_default });
    setEditing({ mode: 'edit', id: z.id });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.mode === 'create') await adminApi.createDeliveryZone(form);
      else await adminApi.updateDeliveryZone(editing.id, form);
      show(editing.mode === 'create' ? 'Delivery location added ✓' : 'Delivery location updated ✓');
      setEditing(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (z) => {
    if (!window.confirm(`Delete delivery location "${z.name}"?`)) return;
    try {
      await adminApi.deleteDeliveryZone(z.id);
      show('Delivery location deleted');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Delivery Fees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Set delivery cost per location. Customers see this at checkout.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Location</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((z) => (
          <div key={z.id} className={`card p-5 ${z.is_default ? 'ring-2 ring-orange-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900">{z.name}</h3>
                <p className="mt-1 text-sm font-bold text-slate-700">{formatTZS(z.price)}</p>
              </div>
              <span className="text-2xl">🛵</span>
            </div>
            {z.is_default && (
              <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600">
                DEFAULT (fallback)
              </span>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(z)} className="btn-ghost !px-3 !py-1.5 text-xs">Edit</button>
              <button onClick={() => remove(z)} className="btn-ghost !px-3 !py-1.5 text-xs text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.mode === 'create' ? 'Add Delivery Location' : 'Edit Delivery Location'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Location name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kinondoni"
              required
            />
          </div>
          <div>
            <label className="label">Delivery fee (TZS)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="500"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4"
            />
            Default location (used when no zone matches)
          </label>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDelivery;
