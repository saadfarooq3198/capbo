export const RBAC = {
  admin: { all: true },  // superuser
  manager: {
    settings: ["view","edit_non_security"],
    users: ["invite","edit_non_admin","reset_password_non_admin","list"],
    projects: ["create","edit","archive","list","read"],
    runs: ["create","read","replay","cancel"],
    data: ["ingest","read","configure_sources"],
    audit: ["read"]
  },
  operator: {
    settings: ["view_limited"],
    users: ["list"],
    projects: ["read","list"],
    runs: ["create","read","replay"],
    data: ["ingest","read"]
  },
  reviewer: {
    settings: ["view_min"],
    users: ["none"],
    projects: ["read","list"],
    runs: ["read"],
    data: ["read"]
  }
};

export function hasPerm(role, domain, action) {
  role = (role||"").toLowerCase();
  const r = RBAC[role]; 
  if (!r) return false;
  if (r.all) return true;
  const set = r[domain]; 
  if (!set) return false;
  if (set === "all") return true;
  return Array.isArray(set) && set.includes(action);
}

export function can(role, domain, action) {
  return hasPerm(role, domain, action);
}

export function visible(role, domain, action) {
  return can(role, domain, action);
}

// Get effective role for UI (considering view-as for admins)
export function getEffectiveRole(actualRole) {
  if (actualRole === 'admin') {
    const viewAsRole = sessionStorage.getItem('cabpoe.viewAsRole');
    return viewAsRole || actualRole;
  }
  return actualRole;
}

// Normalize legacy readonly role
export function normalizeRole(role) {
  return role === 'readonly' ? 'reviewer' : role;
}