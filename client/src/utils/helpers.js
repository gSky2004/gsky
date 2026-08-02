export const WHATSAPP_NUMBER = '0675029833';

export const whatsappLink = (message) =>
  `https://wa.me/255${WHATSAPP_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(message)}`;

export const DEFAULT_WHATSAPP_MSG =
  'Hello Gsky Sport Shoes 👋 I would like to know more about your shoes.';

export const formatTZS = (n) =>
  `TZS ${Number(n || 0).toLocaleString('en-US')}`;

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const orderStatusStyle = (status) => {
  const map = {
    PENDING: 'bg-amber-100 text-amber-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-violet-100 text-violet-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-600',
    COMPLETED: 'bg-slate-900 text-white',
    PAID: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-600',
    REFUNDED: 'bg-slate-200 text-slate-600',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};
