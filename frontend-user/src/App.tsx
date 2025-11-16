import { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import { Box, CircularProgress } from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store';
import { lightTheme, darkTheme } from './utils/theme';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import { restoreAuth } from './store/slices/authSlice';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import AppRoutes from './routes';
import './i18n';

function AppContent() {
  const theme = useAppSelector((state) => state.ui.theme);
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const dispatch = useAppDispatch();
  const [appReady, setAppReady] = useState(false);

  // Initialize token refresh mechanism
  useTokenRefresh();

  useEffect(() => {
    // Restore authentication state from localStorage
    const savedAuthState = localStorage.getItem('authState');
    if (savedAuthState) {
      try {
        const authData = JSON.parse(savedAuthState);
        dispatch(restoreAuth(authData));
      } catch (err) {
        console.error('Failed to restore auth state:', err);
        localStorage.removeItem('authState');
      }
    }
    setAppReady(true);
  }, [dispatch]);

  if (!appReady) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
      />
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
