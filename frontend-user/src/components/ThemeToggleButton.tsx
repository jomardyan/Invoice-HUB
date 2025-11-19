import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { setTheme } from '../store/slices/uiSlice';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const ThemeToggleButton = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);

  const handleToggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton onClick={handleToggleTheme} color="inherit">
        {theme === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
