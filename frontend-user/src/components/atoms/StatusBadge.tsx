import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'default';
      case 'sent':
      case 'viewed':
        return 'info';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status}
      color={getColor(status)}
      size="small"
      sx={{ fontWeight: 600, textTransform: 'capitalize' }}
    />
  );
}

export default StatusBadge;
