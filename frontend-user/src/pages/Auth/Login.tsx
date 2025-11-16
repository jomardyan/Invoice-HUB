import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../hooks/useRedux';
import { setAuth, setLoading, setError } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../store/api/authApi';
import { toast } from 'react-toastify';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error: apiError }] = useLoginMutation();
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const response = await login(data).unwrap();
      const { user, accessToken, refreshToken } = response;
      
      // Create tenant object from response
      const tenant = response.tenant || {
        id: user.tenantId,
        name: 'Default',
        subscriptionTier: 'free',
        subscriptionStatus: 'active' as const,
        monthlyInvoiceLimit: 0,
        currentMonthInvoices: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(setAuth({ user, tenant, accessToken, refreshToken }));
      dispatch(setLoading(false));
      toast.success('Login successful!');
      navigate(`/${tenant.id}/dashboard`);
    } catch (err: any) {
      const message = err?.data?.message || 'Login failed. Please try again.';
      dispatch(setError(message));
      dispatch(setLoading(false));
      toast.error(message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to continue to Invoice-HUB
            </Typography>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {apiError && 'data' in apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(apiError.data as any)?.message || 'Login failed'}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
                autoComplete="email"
                disabled={isLoading}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 3 }}
                autoComplete="current-password"
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mb: 2, py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register" underline="hover">
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Login;
