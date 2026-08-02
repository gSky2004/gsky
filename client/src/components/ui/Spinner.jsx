export const Spinner = ({ className = '' }) => (
  <div className={`grid min-h-[60vh] place-items-center ${className}`}>
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
  </div>
);

export const ButtonSpinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
);
