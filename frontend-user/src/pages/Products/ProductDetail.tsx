import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useState } from 'react';
import { ArrowBack, Edit, Inventory } from '@mui/icons-material';
import { useGetProductByIdQuery } from '../../store/api/productApi';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { data: product, isLoading } = useGetProductByIdQuery(id!);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!product) {
    return <Typography>Product not found</Typography>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="flex-start" gap={3}>
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
            }}
          >
            <Inventory sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h4" fontWeight={700}>
                {product.name}
              </Typography>
              <Chip
                size="small"
                label={product.isActive ? 'Active' : 'Inactive'}
                color={product.isActive ? 'success' : 'default'}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              SKU: {product.sku}
            </Typography>
            
            <Box display="flex" gap={2} mt={2}>
              <Button variant="contained" startIcon={<Edit />}>
                Edit Product
              </Button>
              <Button variant="outlined">Add to Invoice</Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Sales History" />
          <Tab label="Activity" />
        </Tabs>

        <Box sx={{ px: 3 }}>
          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Product Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Product Name"
                      secondary={product.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="SKU"
                      secondary={product.sku}
                    />
                  </ListItem>
                  {product.description && (
                    <ListItem>
                      <ListItemText
                        primary="Description"
                        secondary={product.description}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Pricing & Tax
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Unit Price"
                      secondary={`${product.price?.toFixed(2) || '0.00'} PLN`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="VAT Rate"
                      secondary={`${(product as any).vatRate || 23}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Unit"
                      secondary={(product as any).unit || 'pcs'}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography>
                      {format(new Date(product.createdAt), 'MMMM d, yyyy')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography>
                      {format(new Date(product.updatedAt), 'MMMM d, yyyy')}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography color="text.secondary">
              Sales history and analytics will be displayed here
            </Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography color="text.secondary">
              Activity timeline will be shown here
            </Typography>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

export default ProductDetail;
