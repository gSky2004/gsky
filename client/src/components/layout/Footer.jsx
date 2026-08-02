import { Link } from 'react-router-dom';
import { whatsappLink, DEFAULT_WHATSAPP_MSG } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();
  return (
  <footer className="mt-20 bg-slate-950 text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-lg">👟</span>
          <span className="font-display text-lg font-bold text-white">
            GSKY<span className="text-orange-500">.</span>
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          {t.footer.tagline}
        </p>
        <a
          href={whatsappLink(DEFAULT_WHATSAPP_MSG)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          {t.footer.whatsapp}
        </a>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">{t.footer.shop}</h4>
        <ul className="mt-4 space-y-2 text-sm">
          <li><Link to="/shop" className="hover:text-orange-400">{t.footer.allShoes}</Link></li>
          <li><Link to="/shop?featured=true" className="hover:text-orange-400">{t.footer.featured}</Link></li>
          <li><Link to="/shop?is_new=true" className="hover:text-orange-400">{t.footer.newArrivals}</Link></li>
          <li><Link to="/shop?best_seller=true" className="hover:text-orange-400">{t.footer.bestSellers}</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">{t.footer.company}</h4>
        <ul className="mt-4 space-y-2 text-sm">
          <li><Link to="/track" className="hover:text-orange-400">{t.footer.track}</Link></li>
          <li><Link to="/about" className="hover:text-orange-400">{t.footer.about}</Link></li>
          <li><Link to="/contact" className="hover:text-orange-400">{t.footer.contact}</Link></li>
          <li><Link to="/#services" className="hover:text-orange-400">{t.nav.services}</Link></li>
          <li><Link to="/#team" className="hover:text-orange-400">{t.nav.team}</Link></li>
          <li><Link to="/#testimonials" className="hover:text-orange-400">{t.nav.testimonials}</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">{t.footer.findUs}</h4>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          <li>Gsky Sport Shoes</li>
          <li>DIT, Morogoro Road</li>
          <li>Dar es Salaam, Tanzania</li>
          <li>
            WhatsApp:{' '}
            <a href={whatsappLink(DEFAULT_WHATSAPP_MSG)} target="_blank" rel="noreferrer" className="font-semibold text-emerald-400">
              0675029833
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} Gsky Sport Shoes · DIT, Morogoro Road, Dar es Salaam. {t.footer.rights}
    </div>
    <div className="border-t border-white/10 bg-slate-900 py-3 text-center text-xs text-slate-400">
      {t.footer.developedBy} <span className="font-bold text-orange-500">Gsky</span>
    </div>
  </footer>
  );
};
