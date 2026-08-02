import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../../services/gskyApi';
import { Spinner, ButtonSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { formatTZS } from '../../utils/helpers';

const SIZE_OPTIONS = [39, 40, 41, 42, 43, 44];

const AdminProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { show } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_featured: false,
    is_new: true,
    is_best_seller: false,
    sizes: SIZE_OPTIONS.map((s) => ({ size: String(s), stock_quantity: 0 })),
  });
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    categoriesApi.list().then((c) => {
      setCategories(c.categories);
      if (c.categories[0] && !isEdit) setForm((f) => ({ ...f, category_id: c.categories[0].id }));
    });

    if (isEdit) {
      productsApi.getById(id).then(({ product }) => {
        setForm({
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.category_id || '',
          is_featured: product.is_featured,
          is_new: product.is_new,
          is_best_seller: product.is_best_seller,
          sizes: SIZE_OPTIONS.map((s) => {
            const found = product.sizes.find((x) => x.size === String(s));
            return { size: String(s), stock_quantity: found ? found.stock_quantity : 0 };
          }),
        });
        setExistingImages(product.images || []);
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const setSizeStock = (size, value) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s) => (s.size === size ? { ...s, stock_quantity: Number(value) } : s)),
    }));

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('category_id', form.category_id);
      data.append('is_featured', String(form.is_featured));
      data.append('is_new', String(form.is_new));
      data.append('is_best_seller', String(form.is_best_seller));
      form.sizes.forEach((s) => data.append('sizes', JSON.stringify(s)));
      files.forEach((f) => data.append('images', f));
      if (isEdit) {
        existingImages.forEach((url) => data.append('gallery', url));
      }

      if (isEdit) {
        await productsApi.update(id, data);
        show('Product updated ✓');
      } else {
        await productsApi.create(data);
        show('Product created ✓');
      }
      navigate('/admin/products');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const totalStock = form.sizes.reduce((s, x) => s + x.stock_quantity, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="text-sm font-semibold text-slate-500 hover:text-orange-500">← Products</Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <form onSubmit={submit} className="card space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Product name</label>
            <input className="input" value={form.name} onChange={set('name')} required placeholder="Gsky Runner Pro" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-[120px]" value={form.description} onChange={set('description')} required placeholder="Describe the shoe…" />
          </div>
          <div>
            <label className="label">Price (TZS)</label>
            <input className="input" type="number" min="0" step="500" value={form.price} onChange={set('price')} required placeholder="85000" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={set('category_id')}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="label">Sizes & Stock</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {form.sizes.map((s) => (
              <div key={s.size} className="rounded-xl border border-slate-200 p-2 text-center">
                <p className="text-sm font-bold text-slate-700">Size {s.size}</p>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm"
                  type="number"
                  min="0"
                  value={s.stock_quantity}
                  onChange={(e) => setSizeStock(s.size, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Total stock: {totalStock} pairs</p>
        </div>

        <div>
          <p className="label">Images</p>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((url, i) => (
              <div key={i} className="relative h-20 w-20">
                <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <button type="button" onClick={() => setExistingImages(existingImages.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs text-white">✕</button>
              </div>
            ))}
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-2xl text-slate-400 hover:border-orange-500">
              ＋
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])} />
            </label>
          </div>
          {files.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">{files.length} new image(s) selected</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="h-5 w-5 accent-orange-500" />
            <span className="text-sm font-semibold text-slate-700">Featured</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input type="checkbox" checked={form.is_new} onChange={set('is_new')} className="h-5 w-5 accent-orange-500" />
            <span className="text-sm font-semibold text-slate-700">New arrival</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input type="checkbox" checked={form.is_best_seller} onChange={set('is_best_seller')} className="h-5 w-5 accent-orange-500" />
            <span className="text-sm font-semibold text-slate-700">Best seller</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/admin/products" className="btn-ghost">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <ButtonSpinner /> : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
