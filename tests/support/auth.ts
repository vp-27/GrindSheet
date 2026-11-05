export const authState = {
  user: null as { id: string } | null,
  loading: false,
  isDemo: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: true }),
  resetPasswordForEmail: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  startDemo: () => {},
  signOut: async () => ({ error: null }),
};
export const useAuth = () => authState;
