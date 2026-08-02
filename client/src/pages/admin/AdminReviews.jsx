import { useEffect, useState } from 'react';
import { adminApi, reviewsApi } from '../../services/gskyApi';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { RatingStars } from '../../components/ui/RatingStars';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';

const AdminReviews = () => {
  const { show } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi
      .reviews()
      .then((d) => setReviews(d.reviews || []))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async () => {
    try {
      await reviewsApi.remove(confirm.id);
      show('Review removed');
      setConfirm(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Reviews</h1>
      {reviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews yet" description="Customer reviews will appear here." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex-1 min-w-60">
                <div className="flex items-center gap-2">
                  <RatingStars value={r.rating} />
                  <span className="text-sm font-semibold text-slate-800">{r.full_name}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.comment || <span className="italic text-slate-400">No comment</span>}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {r.product_name} · {new Date(r.created_at).toLocaleDateString()} · {r.user_email}
                </p>
              </div>
              <button onClick={() => setConfirm(r)} className="btn-ghost !px-3 !py-1.5 text-xs text-red-500">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete review">
        <p className="text-sm text-slate-600">
          Remove the review by <span className="font-bold">{confirm?.full_name}</span> on{' '}
          <span className="font-bold">{confirm?.product_name}</span>?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirm(null)} className="btn-ghost">Cancel</button>
          <button onClick={remove} className="btn bg-red-500 text-white hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReviews;
