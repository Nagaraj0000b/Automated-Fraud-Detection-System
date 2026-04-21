const fallbackSignups = [];

const getInitials = (name = '') =>
  String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

const RecentSignups = ({ signups = fallbackSignups }) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-950">Recent Signups</h3>
      </div>

      <div className="space-y-4">
        {signups.map((signup) => (
          <div key={signup.email} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {signup.initial || getInitials(signup.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{signup.name}</p>
                <p className="truncate text-xs text-slate-500">{signup.email}</p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {signup.role}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentSignups;
