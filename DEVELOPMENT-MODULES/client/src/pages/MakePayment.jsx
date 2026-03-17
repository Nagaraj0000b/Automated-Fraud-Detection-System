import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI, accountAPI } from '../services/api';

const MakePayment = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [form, setForm] = useState({ amount: '', recipient: '', description: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDetecting, setLocationDetecting] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && Array.isArray(res.accounts) && res.accounts.length > 0) {
          setAccounts(res.accounts);
          setSelectedAccountId(res.accounts[0].accountId);
        }
      } catch (e) {
        setError('Failed to load accounts.');
      }
    })();
  }, []);

  // Auto-detect user location (browser will ask for permission)
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const loc = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setForm((prev) => ({ ...prev, location: loc }));
        setLocationDetecting(false);
      },
      () => {
        // If user denies or it fails, they can type location manually
        setLocationDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      await transactionAPI.createTransaction({
        amount: amountNumber,
        recipient: form.recipient.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        transactionType: 'transfer',
        accountId: selectedAccountId,
      });
      setSuccess('Payment created successfully and will appear in your dashboard.');
      setForm({ amount: '', recipient: '', description: '', location: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/customer-dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-4">
      <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Make a Payment</h1>
        <p className="text-xs text-white/50 mb-6">
          Choose a bank account, enter payment details, and this transaction will be visible under your Customer Dashboard where you can also raise disputes.
        </p>

        {error && <div className="mb-3 text-xs text-rose-300">{error}</div>}
        {success && <div className="mb-3 text-xs text-emerald-300">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">From Bank Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId} className="bg-slate-900">
                  {acc.bankName} ({acc.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Recipient / Merchant</label>
            <input
              type="text"
              name="recipient"
              value={form.recipient}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="e.g., Flipkart, Amazon, UPI ID"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1 flex items-center justify-between">
              <span>Location</span>
              {locationDetecting && (
                <span className="text-[10px] text-cyan-300">Detecting from device…</span>
              )}
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="Auto-detected or enter manually (e.g., Mumbai, IN)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Description (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              placeholder="Add a note for this payment"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={goToDashboard}
              className="text-xs text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5"
            >
              ← Back to Dashboard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg px-4 py-2 shadow-lg shadow-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
