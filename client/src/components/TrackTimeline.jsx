import { useLanguage } from '../context/LanguageContext';

const icons = ['📝', '📦', '🛵', '🏠', '✅'];

export const TrackTimeline = ({ order }) => {
  const { t, tf } = useLanguage();
  const STEPS = [
    { key: 'PENDING', label: t.timeline.placed },
    { key: 'PROCESSING', label: t.timeline.processing },
    { key: 'SHIPPED', label: t.timeline.assigned },
    { key: 'DELIVERED', label: t.timeline.delivered },
    { key: 'COMPLETED', label: t.timeline.completed },
  ];
  const idx = STEPS.findIndex((s) => s.key === order.order_status);
  const current = idx < 0 ? 0 : idx;
  const cancelled = order.order_status === 'CANCELLED';
  const confirmed = !!order.client_confirmed_at;

  if (cancelled) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-center">
        <span className="text-4xl">🚫</span>
        <p className="mt-2 font-display text-lg font-bold text-red-700">{t.timeline.cancelled}</p>
        <p className="text-sm text-red-500">{t.timeline.cancelledDesc}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {STEPS.map((s, i) => {
          const done = i <= current;
          const isCurrent = i === current;
          return (
            <div key={s.key} className="flex min-w-0 flex-1 flex-col items-center text-center">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full text-sm transition sm:h-12 sm:w-12 sm:text-xl ${
                  done ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {icons[i]}
              </div>
              <p className={`mt-1.5 break-words text-[11px] font-bold leading-tight sm:mt-2 sm:text-sm ${isCurrent ? 'text-orange-600' : done ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </p>
              {i < STEPS.length - 1 && (
                <div className={`mt-1.5 h-1 w-full rounded sm:mt-2 ${i < current ? 'bg-orange-500' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 text-sm">
        {current < STEPS.length - 1 ? (
          <p className="text-slate-600">
            {tf(t.timeline.currentStage, { stage: STEPS[current].label, next: STEPS[current + 1].label })}
          </p>
        ) : (
          <p className="font-bold text-emerald-600">{t.timeline.orderCompleted}</p>
        )}
        {confirmed && (
          <p className="mt-1 text-emerald-600">
            {tf(t.timeline.confirmedByClient, { date: new Date(order.client_confirmed_at).toLocaleString() })}
          </p>
        )}
      </div>
    </div>
  );
};
