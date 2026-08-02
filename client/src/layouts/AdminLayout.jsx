import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/products', label: 'Products', icon: '👟' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/customers', label: 'Customers', icon: '👥' },
  { to: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/admin/promos', label: 'Promo Codes', icon: '🏷️' },
  { to: '/admin/delivery', label: 'Delivery Fees', icon: '🛵' },
  { to: '/admin/newsletter', label: 'Newsletter', icon: '📧' },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 text-slate-300 md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-lg">👟</span>
          <div>
            <p className="font-display font-bold text-white">GSKY</p>
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-orange-500 text-white' : 'hover:bg-white/10'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/10">
            🏠 View Store
          </NavLink>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-white/10">
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <p className="font-display font-bold text-slate-900">
            Admin · <span className="text-orange-500">{user?.full_name}</span>
          </p>
          <div className="flex items-center gap-2 md:hidden">
            <NavLink to="/" className="btn-ghost !px-3 !py-2 text-xs">Store</NavLink>
            <button onClick={handleLogout} className="btn-ghost !px-3 !py-2 text-xs text-red-500">Logout</button>
          </div>
        </header>
        <div className="grid gap-1 border-b border-slate-200 bg-white p-2 md:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2.5 text-sm font-semibold ${isActive ? 'bg-orange-500 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              {n.icon} {n.label}
            </NavLink>
          ))}
        </div>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
