import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI, accountAPI } from '../services/api';
import { ArrowLeft, Send, MapPin, Building2, CreditCard, AlertCircle } from 'lucide-react';

const MakePayment = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationDetecting, setLocationDetecting] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await accountAPI.getMyAccounts();
        if (response.success && response.accounts && response.accounts.length > 0) {
          setAccounts(response.accounts);
          setSelectedAccountId(response.accounts[0].accountId);
        }
      } catch (err) {
        console.error('Failed to load accounts', err);
        setError('Failed to load your accounts. Please try again.');
      }
    };
    fetchAccounts();
  }, []);

  const detectLocation = () => {
    setLocationDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            long: position.coords.longitude
          });
          setLocationDetecting(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationDetecting(false);
        }
      );
    } else {
      setLocationDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccountId || !amount || !recipient) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const payload = {
        accountId: selectedAccountId,
        amount: Number(amount),
        transactionType: 'transfer',
        recipient,
        description,
        location: location ? `${location.lat.toFixed(2)}, ${location.long.toFixed(2)}` : undefined
      };
      
      await transactionAPI.createTransaction(payload);
      navigate('/customer-dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
        
        <button 
          onClick={() => navigate('/customer-dashboard')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transfer Funds</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Securely transfer money. This transaction will be monitored by FraudGuard AI.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">From Bank Account</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Select an account</option>
                {accounts.map(acc => (
                  <option key={acc.accountId} value={acc.accountId}>
                    {acc.bankName} (****{acc.accountNumber?.slice(-4) || '0000'})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recipient / Merchant</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                placeholder="e.g. Amazon, John Doe"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
              {locationDetecting && <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Detecting...</span>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={detectLocation}
                className="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl transition-all"
                title="Detect Location"
              >
                <MapPin className="w-5 h-5" />
              </button>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 flex items-center text-sm font-medium text-slate-500">
                {location ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified ({location.lat.toFixed(2)}, {location.long.toFixed(2)})
                  </span>
                ) : (
                  <span>No location attached</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all min-h-[100px] resize-none"
              placeholder="What is this transfer for?"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  <Send className="w-5 h-5" /> Confirm Transfer
                </>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default MakePayment;