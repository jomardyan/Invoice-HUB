import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { selectAccessToken, selectRefreshToken, updateAccessToken } from '../store/slices/authSlice';
import { useRefreshTokenMutation } from '../store/api/authApi';

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh every 10 minutes

export function useTokenRefresh() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const [refreshTokenMutation, { isLoading }] = useRefreshTokenMutation();

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        console.log('Attempting to refresh access token...');
        const response = await refreshTokenMutation({ refreshToken }).unwrap();
        
        if (response.data?.accessToken) {
          // Update access token in localStorage and Redux
          dispatch(updateAccessToken(response.data.accessToken));
          console.log('Access token refreshed successfully');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Token refresh failed - user will need to login again
        // This could be handled by clearing auth on next request
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken, dispatch, refreshTokenMutation]);

  return { isRefreshing: isLoading };
}
