
export const isPreview = 
  !!(window).__BASE44_EDITOR__ || (location.search.includes("preview=1") && location.pathname.includes('/editor/'));

export const mockUser = {
  id: 'preview-admin-001',
  email: 'admin@preview.cabpoe.com',
  full_name: 'Preview Admin',
  role: 'admin',
  department: 'Development',
  last_login: new Date().toISOString()
};

// In preview mode, bypass auth and provide mock user
if (isPreview) {
  console.log('🎭 Preview Mode: Mock admin user active');
  
  // Mock the User entity methods for preview
  // Note: This does not use getEffectiveRole, it provides a base mock user.
  // The application logic (e.g., in Settings page) should then apply getEffectiveRole on top of this.
  window.__MOCK_USER_ENTITY__ = {
    me: async () => mockUser,
    updateMyUserData: async (data) => ({ ...mockUser, ...data }),
    logout: async () => { console.log('Mock logout in preview mode'); },
    login: async () => { console.log('Mock login in preview mode'); },
    loginWithRedirect: async (url) => { console.log('Mock login redirect:', url); }
  };
}
