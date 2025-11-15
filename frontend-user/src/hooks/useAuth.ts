import { useAppSelector } from './useRedux';

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);

  return {
    user: auth.user,
    tenant: auth.tenant,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    accessToken: auth.accessToken,
  };
};
