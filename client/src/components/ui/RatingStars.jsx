export const RatingStars = ({ value = 0, size = 'text-base', onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`flex gap-0.5 ${size}`}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange && onChange(s)}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-125' : 'cursor-default'}
          aria-label={`${s} star`}
        >
          <span className={s <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'}>★</span>
        </button>
      ))}
    </div>
  );
};
