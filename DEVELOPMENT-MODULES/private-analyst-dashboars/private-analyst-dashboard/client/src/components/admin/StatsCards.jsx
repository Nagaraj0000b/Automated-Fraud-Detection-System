import {
  AlertTriangle,
  Ban,
  CreditCard,
  Users,
} from 'lucide-react';

const StatsCards = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Transactions',
      value: stats?.transactions?.total ?? '0',
      subtitle: 'Processed across all channels',
      icon: CreditCard,
      iconClassName: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Flagged (Review)',
      value: stats?.transactions?.flaggedFrauds ?? '0',
      subtitle: 'Queued for analyst review',
      icon: AlertTriangle,
      iconClassName: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Blocked (Fraud)',
      value: stats?.transactions?.blockedFrauds ?? '0',
      subtitle: 'Stopped before settlement',
      icon: Ban,
      iconClassName: 'bg-rose-100 text-rose-600',
    },
    {
      title: 'System Users',
      value: stats?.users?.total ?? '0',
      subtitle: 'Active accounts in platform',
      icon: Users,
      iconClassName: 'bg-emerald-100 text-emerald-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-slate-400">{card.subtitle}</p>
              </div>

              <div className={`rounded-lg p-3 ${card.iconClassName}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default StatsCards;
