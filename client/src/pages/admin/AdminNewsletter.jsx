import { useEffect, useState } from 'react';
import { adminApi, newsletterApi } from '../../services/gskyApi';
import { Spinner, ButtonSpinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const AdminNewsletter = () => {
  const { show } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = () =>
    adminApi.newsletter().then((d) => {
      setData(d);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const sendCampaign = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await newsletterApi.campaign(campaign);
      show(res.message);
      setCampaign({ subject: '', body: '' });
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await adminApi.sendTestEmail('mwansisyagasper2004@gmail.com');
      show(`Test email sent to ${res.to}`);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading || !data) return <Spinner />;

  const active = data.subscribers.filter((s) => s.subscribed);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Newsletter</h1>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display font-bold text-slate-900">Email Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Verify your SMTP is working — we'll send a test email to <strong className="break-all">mwansisyagasper2004@gmail.com</strong>.
          </p>
        </div>
        <button onClick={sendTest} disabled={testing} className="btn-primary !py-2.5">
          {testing ? <ButtonSpinner /> : 'Send Test Email'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card min-w-0 p-6">
          <h2 className="font-display font-bold text-slate-900">Subscribers ({active.length} active)</h2>
          {data.subscribers.length === 0 ? (
            <div className="mt-4"><EmptyState icon="📧" title="No subscribers yet" /></div>
          ) : (
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {data.subscribers.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="break-all text-xs text-slate-500">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.subscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {s.subscribed ? 'Subscribed' : 'Unsubscribed'}
                    </span>
                    {s.shoe_size && <p className="mt-1 text-[10px] text-slate-400">Size {s.shoe_size}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card min-w-0 p-6">
          <h2 className="font-display font-bold text-slate-900">Send Marketing Email</h2>
          <p className="mt-1 text-xs text-slate-400">Goes to {active.length} active subscriber(s). Every email includes an unsubscribe link.</p>
          <form onSubmit={sendCampaign} className="mt-4 space-y-4">
            <div>
              <label className="label">Subject</label>
              <input className="input" value={campaign.subject} onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })} required placeholder="New arrivals just landed 👟" />
            </div>
            <div>
              <label className="label">Message body</label>
              <textarea className="input min-h-[140px]" value={campaign.body} onChange={(e) => setCampaign({ ...campaign, body: e.target.value })} required placeholder="Write your promotion…" />
            </div>
            <button type="submit" disabled={sending || active.length === 0} className="btn-primary w-full">
              {sending ? <ButtonSpinner /> : `Send to ${active.length} subscriber${active.length === 1 ? '' : 's'}`}
            </button>
          </form>
        </div>
      </div>

      {data.campaigns.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900">Campaign History</h2>
          <div className="mt-3 space-y-2">
            {data.campaigns.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{c.subject}</p>
                  <p className="text-xs text-slate-400">{new Date(c.sent_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">{c.recipient_count} sent</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
