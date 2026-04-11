export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function getHomePathForRole(role) {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'analyst') return '/analyst/dashboard';
  return '/customer-dashboard';
}

export function getHomePathForUser(user) {
  return getHomePathForRole(user?.role);
}
