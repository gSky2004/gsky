import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/shop', label: 'Shop' },
  { to: '/#new-arrivals', label: 'New Arrivals' },
  { to: '/track', label: 'Track Order' },
  { to: '/contact', label: 'Contact' },
];

const keyFor = (label) =>
  ({ Home: 'home', About: 'about', Shop: 'shop', 'New Arrivals': 'arrivals', 'Track Order': 'track', Contact: 'contact' })[label] || 'home';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { lang, t, toggle } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-lg">👟</span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            GSKY<span className="text-orange-500">.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((l) =>
            l.to.startsWith('/#') ? (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              >
                {t.nav[keyFor(l.label)]}
              </Link>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {t.nav[keyFor(l.label)]}
              </NavLink>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            aria-label="Switch language"
            title="Switch language"
          >
            {lang === 'en' ? 'SW' : 'EN'}
          </button>

          <Link
            to="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
            aria-label="Cart"
          >
            🛒
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-orange-500 text-[11px] font-bold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="btn-ghost !px-4 !py-2">
                {t.common.logout}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost !px-4 !py-2">
                {t.common.login}
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2">
                {t.common.signup}
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 lg:hidden"
            aria-label="Menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((l) =>
                l.to.startsWith('/#') ? (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {t.nav[keyFor(l.label)]}
                  </Link>
                ) : (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-4 py-3 text-sm font-semibold ${
                        isActive ? 'bg-slate-900 text-white' : 'text-slate-700'
                      }`
                    }
                  >
                    {t.nav[keyFor(l.label)]}
                  </NavLink>
                )
              )}
              <Link to={user ? '/wishlist' : '/login'} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700">
                🤍 {t.common.wishlist}
              </Link>
              <div className="my-2 h-px bg-slate-200" />
              {user ? (
                <>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="btn-dark w-full">
                      {t.common.dashboard}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="btn-outline w-full">
                    {t.common.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                    {t.common.login}
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                    {t.common.signup}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
