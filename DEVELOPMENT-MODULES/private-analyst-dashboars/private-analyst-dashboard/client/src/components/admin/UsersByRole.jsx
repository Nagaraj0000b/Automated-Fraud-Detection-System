const fallbackRoles = [];

const UsersByRole = ({ roles = fallbackRoles }) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-950">Users by Role</h3>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.name}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-700">{role.name}</span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {role.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UsersByRole;
