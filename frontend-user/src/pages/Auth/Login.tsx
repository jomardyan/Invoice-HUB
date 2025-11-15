import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../../hooks/useRedux';
import { setAuth } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../store/api/authApi';
import { toast } from 'react-toastify';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error: apiError }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();
      const { user, tenant, accessToken, refreshToken } = response;

      dispatch(setAuth({ user, tenant, accessToken, refreshToken }));
      toast.success('Login successful!');
      navigate(`/${tenant.id}/dashboard`);
    } catch (err: any) {
      const message = err?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Welcome back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sign in to continue to Invoice-HUB
      </Typography>

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
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ mb: 1 }}
          autoComplete="current-password"
        />

        <Box sx={{ textAlign: 'right', mb: 3 }}>
          <Link href="#" variant="body2" underline="hover">
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link href="/register" underline="hover">
              Sign up
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
}

export default Login;

