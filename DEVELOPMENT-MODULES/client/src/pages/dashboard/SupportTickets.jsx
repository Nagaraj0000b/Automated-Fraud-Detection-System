import React, { useEffect, useState } from 'react';
import { supportAPI } from '@/services/api';
import { AlertCircle, Inbox } from 'lucide-react';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const res = await supportAPI.getTickets();
        setTickets(res.tickets || []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        Loading support requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-700">
        <AlertCircle className="w-4 h-4 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Support Requests</h2>
        <p className="text-slate-500 text-sm">Unblock and suspension requests sent by users.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
          <Inbox className="w-8 h-8 mb-2" />
          No support tickets yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-900 whitespace-nowrap">{t.email}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {t.type || 'ACCOUNT_SUSPENDED'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-md">
                    <div className="line-clamp-3 text-xs md:text-sm">{t.message}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${
                      t.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : t.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status || 'open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
