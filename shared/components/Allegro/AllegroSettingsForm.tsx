/**
 * Shared Allegro Settings Form Component
 * Reusable form for configuring Allegro integration settings
 */
import React from 'react';
import {
  Box,
  TextField,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  InputAdornment,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import SyncIcon from '@mui/icons-material/Sync';
import type { AllegroSettings } from '../../types/allegro';

export interface AllegroSettingsFormProps {
  settings: AllegroSettings;
  onSettingChange: (key: keyof AllegroSettings, value: boolean | number) => void;
  disabled?: boolean;
}

export const AllegroSettingsForm: React.FC<AllegroSettingsFormProps> = ({
  settings,
  onSettingChange,
  disabled = false,
}) => {
  return (
    <Box>
      {/* Auto-Generation Settings */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <StorageIcon sx={{ fontSize: 20 }} />
          Automatic Processing
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoGenerateInvoices ?? true}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onSettingChange('autoGenerateInvoices', e.target.checked)
                }
                disabled={disabled}
              />
            }
            label="Automatically generate invoices from orders"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
            When enabled, invoices will be created automatically when orders are synced
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoCreateCustomer ?? true}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onSettingChange('autoCreateCustomer', e.target.checked)
                }
                disabled={disabled}
              />
            }
            label="Automatically create customers"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
            Create customer records from Allegro buyers
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoCreateProduct ?? true}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onSettingChange('autoCreateProduct', e.target.checked)
                }
                disabled={disabled}
              />
            }
            label="Automatically create products"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
            Create product records from Allegro offers
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoMarkAsPaid ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onSettingChange('autoMarkAsPaid', e.target.checked)
                }
                disabled={disabled}
              />
            }
            label="Automatically mark invoices as paid"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
            Mark generated invoices as paid if payment is confirmed
          </Typography>
        </FormGroup>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Sync Settings */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SyncIcon sx={{ fontSize: 20 }} />
          Sync Configuration
        </Typography>
        <FormGroup>
          <TextField
            label="Sync Frequency"
            type="number"
            value={settings.syncFrequencyMinutes ?? 60}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              onSettingChange('syncFrequencyMinutes', parseInt(e.target.value))
            }
            disabled={disabled}
            InputProps={{
              endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
            }}
            sx={{ mb: 2 }}
            helperText="How often to automatically sync orders with Allegro"
          />

          <TextField
            label="Default VAT Rate"
            type="number"
            value={settings.defaultVatRate ?? 23}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              onSettingChange('defaultVatRate', parseInt(e.target.value))
            }
            disabled={disabled}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            sx={{ mb: 2 }}
            helperText="Default VAT rate for products created from Allegro offers"
          />
        </FormGroup>
      </Box>
    </Box>
  );
};
