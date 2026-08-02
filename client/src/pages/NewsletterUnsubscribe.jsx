import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { newsletterApi } from '../services/gskyApi';
import { SEO } from '../components/SEO';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { ButtonSpinner } from '../components/ui/Spinner';

const NewsletterUnsubscribe = () => {
  const [params] = useSearchParams();
  const { show } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState(params.get('email') || '');

  useEffect(() => {
    if (params.get('email')) {
      newsletterApi
        .unsubscribe(params.get('email'))
        .then(() => setStatus('done'))
        .catch((err) => {
          if (err.message.includes('not on the subscription list')) setStatus('already');
          else setStatus('error');
        });
    } else {
      setStatus('form');
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await newsletterApi.unsubscribe(email);
      setStatus('done');
    } catch (err) {
      if (err.message.includes('not on the subscription list')) setStatus('already');
      else {
        show(err.message, 'error');
        setStatus('form');
      }
    }
  };

  return (
    <>
      <SEO title={t.newsletter.unsubSeo} />
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="card p-10">
          {status === 'loading' && <ButtonSpinner />}
          {status === 'form' && (
            <>
              <h1 className="font-display text-2xl font-bold text-slate-900">{t.newsletter.unsubTitle}</h1>
              <p className="mt-2 text-sm text-slate-500">{t.newsletter.unsubSub}</p>
              <form onSubmit={submit} className="mt-5 space-y-3">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                <button className="btn-dark w-full" type="submit">{t.newsletter.unsubBtn}</button>
              </form>
            </>
          )}
          {(status === 'done' || status === 'already') && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-3xl">👋</div>
              <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">{t.newsletter.unsubDone}</h1>
              <p className="mt-2 text-sm text-slate-500">{t.newsletter.unsubDoneSub}</p>
              <Link to="/" className="btn-primary mt-6">{t.notFound.backHome}</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="font-display text-xl font-bold text-slate-900">{t.error.title}</h1>
              <Link to="/" className="btn-primary mt-6">{t.notFound.backHome}</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NewsletterUnsubscribe;
