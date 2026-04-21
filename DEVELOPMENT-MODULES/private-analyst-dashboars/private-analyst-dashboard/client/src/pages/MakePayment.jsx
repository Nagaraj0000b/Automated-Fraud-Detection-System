import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountAPI, transactionAPI } from '../services/api';
import { getDecisionTone } from '../lib/adminDecision';

const MakePayment = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [form, setForm] = useState({ amount: '', recipient: '', description: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [decision, setDecision] = useState(null);
  const [locationDetecting, setLocationDetecting] = useState(false);

  const buildFallbackAccount = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const fallbackId = storedUser.id || storedUser._id || 'local-demo-account';
      return {
        accountId: `acc-${fallbackId}`,
        bankName: 'SecureBank',
        accountNumber: `**** **** **** ${String(fallbackId).slice(-4).toUpperCase()}`,
      };
    } catch {
      return {
        accountId: 'acc-local-demo-account',
        bankName: 'SecureBank',
        accountNumber: '**** **** **** 1001',
      };
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && Array.isArray(res.accounts) && res.accounts.length > 0) {
          setAccounts(res.accounts);
          setSelectedAccountId(res.accounts[0].accountId);
        } else {
          const fallbackAccount = buildFallbackAccount();
          setAccounts([fallbackAccount]);
          setSelectedAccountId(fallbackAccount.accountId);
        }
      } catch {
        const fallbackAccount = buildFallbackAccount();
        setAccounts([fallbackAccount]);
        setSelectedAccountId(fallbackAccount.accountId);
        setError('Live accounts unavailable, using default bank account.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({
          ...prev,
          location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        }));
        setLocationDetecting(false);
      },
      () => {
        setLocationDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
    setDecision(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setDecision(null);

    const amountNumber = parseFloat(form.amount);

    if (!selectedAccountId) {
      setError('Please select a bank account.');
      return;
    }

    if (!amountNumber || amountNumber <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!form.recipient.trim()) {
      setError('Please enter a recipient or merchant.');
      return;
    }

    if (!form.location.trim()) {
      setError('Please enter a location.');
      return;
    }

    setLoading(true);

    try {
      const response = await transactionAPI.createTransaction({
        amount: amountNumber,
        recipient: form.recipient.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        transactionType: 'transfer',
        accountId: selectedAccountId,
      });
      setSuccess(response.message || 'Payment processed successfully.');
      setDecision(response.decision || null);
      setForm({ amount: '', recipient: '', description: '', location: '' });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Make a Payment</h1>
        <p className="mb-6 text-xs text-white/50">
          Choose a bank account, enter payment details, and this transaction will be visible under your Customer Dashboard where you can also raise disputes.
        </p>

        {error ? <div className="mb-3 text-xs text-rose-300">{error}</div> : null}
        {success ? <div className="mb-3 text-xs text-emerald-300">{success}</div> : null}
        {decision ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">AI Review Result</p>
              <span className={`rounded-full px-2.5 py-1 font-semibold ${getDecisionTone(decision.status)}`}>
                {decision.recommendation}
              </span>
            </div>
            <p className="mt-3 text-white/70">
              Risk score: {decision.riskScorePercent}% • Risk level: {String(decision.riskLevel || '').replace(/_/g, ' ')}
            </p>
            {decision.reasons?.length ? (
              <p className="mt-2 text-white/60">Reason: {decision.reasons[0]}</p>
            ) : null}
            <p className="mt-2 text-cyan-300">
              Admin dashboard has been notified about this transaction decision.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">From Bank Account</label>
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(event) => setSelectedAccountId(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-slate-800/80 px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              >
                <option value="" className="bg-slate-900 text-white">
                  Select account
                </option>
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId} className="bg-slate-900 text-white">
                    {account.bankName} ({account.accountNumber})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-white/70">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Amount (Rs.)</label>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Recipient / Merchant</label>
            <input
              type="text"
              name="recipient"
              value={form.recipient}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="e.g., Flipkart, Amazon, UPI ID"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center justify-between text-xs font-medium text-white/70">
              <span>Location</span>
              {locationDetecting ? <span className="text-[10px] text-cyan-300">Detecting from device...</span> : null}
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="Auto-detected or enter manually (e.g., Mumbai, IN)"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Description (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="Add a note for this payment"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate('/customer-dashboard')}
              className="rounded-lg px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white"
            >
              Back to Dashboard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/40 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Send Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakePayment;
