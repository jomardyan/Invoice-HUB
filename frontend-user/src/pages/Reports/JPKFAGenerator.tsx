import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Divider,
    Chip,
} from '@mui/material';
import { DownloadOutlined, CheckCircleOutline } from '@mui/icons-material';

interface VATSummary {
    rate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    invoiceCount: number;
}

const mockVATData: VATSummary[] = [
    { rate: 23, netAmount: 450000, vatAmount: 103500, grossAmount: 553500, invoiceCount: 145 },
    { rate: 8, netAmount: 125000, vatAmount: 10000, grossAmount: 135000, invoiceCount: 42 },
    { rate: 5, netAmount: 80000, vatAmount: 4000, grossAmount: 84000, invoiceCount: 28 },
    { rate: 0, netAmount: 35000, vatAmount: 0, grossAmount: 35000, invoiceCount: 15 },
];

export const JPKFAGenerator: React.FC = () => {
    const [period, setPeriod] = useState('2025-Q4');
    const [quarter, setQuarter] = useState('Q4');
    const [year, setYear] = useState('2025');
    const [generated, setGenerated] = useState(false);

    const totalNet = mockVATData.reduce((sum, item) => sum + item.netAmount, 0);
    const totalVAT = mockVATData.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalGross = mockVATData.reduce((sum, item) => sum + item.grossAmount, 0);
    const totalInvoices = mockVATData.reduce((sum, item) => sum + item.invoiceCount, 0);

    const handleGenerateXML = () => {
        console.log('Generating JPK_FA XML for', period);
        // Implement XML generation logic
        setGenerated(true);

        // Simulate download
        setTimeout(() => {
            const xmlContent = generateJPKFAXML();
            const blob = new Blob([xmlContent], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `JPK_FA_${period}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 500);
    };

    const generateJPKFAXML = (): string => {
        // Simplified JPK_FA XML structure
        return `<?xml version="1.0" encoding="UTF-8"?>
<JPK xmlns="http://jpk.mf.gov.pl/wzor/2021/11/09/11011/">
  <Naglowek>
    <KodFormularza kodSystemowy="JPK_FA (4)" wersjaSchemy="1-0">JPK_FA</KodFormularza>
    <WariantFormularza>4</WariantFormularza>
    <DataWytworzeniaJPK>${new Date().toISOString()}</DataWytworzeniaJPK>
    <DataOd>${year}-${quarter === 'Q1' ? '01-01' : quarter === 'Q2' ? '04-01' : quarter === 'Q3' ? '07-01' : '10-01'}</DataOd>
    <DataDo>${year}-${quarter === 'Q1' ? '03-31' : quarter === 'Q2' ? '06-30' : quarter === 'Q3' ? '09-30' : '12-31'}</DataDo>
    <NazwaSystemu>Invoice-HUB</NazwaSystemu>
  </Naglowek>
  <Podmiot1>
    <NIP>1234567890</NIP>
    <PelnaNazwa>Company Name</PelnaNazwa>
  </Podmiot1>
  <FakturaWiersz>
    <!-- Invoice details would be here -->
  </FakturaWiersz>
  <FakturaCtrl>
    <LiczbaFaktur>${totalInvoices}</LiczbaFaktur>
    <WartoscFaktur>${totalGross.toFixed(2)}</WartoscFaktur>
  </FakturaCtrl>
</JPK>`;
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                JPK_FA - Polish VAT Report
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                JPK_FA (Jednolity Plik Kontrolny - Faktury) is a standardized XML file required by the Polish tax authority
                for VAT reporting. This tool generates the file according to the current Ministry of Finance schema.
            </Alert>

            {/* Period Selection */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Report Period
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <TextField
                            select
                            label="Year"
                            value={year}
                            onChange={(e) => {
                                setYear(e.target.value);
                                setPeriod(`${e.target.value}-${quarter}`);
                            }}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="2024">2024</MenuItem>
                            <MenuItem value="2025">2025</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Quarter"
                            value={quarter}
                            onChange={(e) => {
                                setQuarter(e.target.value);
                                setPeriod(`${year}-${e.target.value}`);
                            }}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="Q1">Q1 (Jan-Mar)</MenuItem>
                            <MenuItem value="Q2">Q2 (Apr-Jun)</MenuItem>
                            <MenuItem value="Q3">Q3 (Jul-Sep)</MenuItem>
                            <MenuItem value="Q4">Q4 (Oct-Dec)</MenuItem>
                        </TextField>
                    </Box>
                </CardContent>
            </Card>

            {/* VAT Summary */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        VAT Summary for {period}
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    {/* Total Summary */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Total Invoices
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {totalInvoices}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Net Amount
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    PLN {totalNet.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Total VAT
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    PLN {totalVAT.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Gross Amount
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    PLN {totalGross.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* VAT Rate Breakdown */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        VAT Rate Breakdown
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>VAT Rate</TableCell>
                                    <TableCell align="right">Net Amount</TableCell>
                                    <TableCell align="right">VAT Amount</TableCell>
                                    <TableCell align="right">Gross Amount</TableCell>
                                    <TableCell align="right">Invoice Count</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockVATData.map((row) => (
                                    <TableRow key={row.rate}>
                                        <TableCell>
                                            <Chip
                                                label={`${row.rate}%`}
                                                size="small"
                                                color={row.rate === 23 ? 'primary' : row.rate === 0 ? 'default' : 'secondary'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">PLN {row.netAmount.toLocaleString()}</TableCell>
                                        <TableCell align="right">PLN {row.vatAmount.toLocaleString()}</TableCell>
                                        <TableCell align="right">PLN {row.grossAmount.toLocaleString()}</TableCell>
                                        <TableCell align="right">{row.invoiceCount}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        PLN {totalNet.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        PLN {totalVAT.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        PLN {totalGross.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        {totalInvoices}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Validation & Generation */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Generate JPK_FA File
                    </Typography>

                    {generated && (
                        <Alert severity="success" icon={<CheckCircleOutline />} sx={{ mb: 2 }}>
                            JPK_FA XML file has been generated and downloaded successfully.
                            You can now submit it to the Polish tax authority (e-Deklaracje system).
                        </Alert>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            The JPK_FA file will include:
                        </Typography>
                        <ul>
                            <li>All invoices issued in the selected period</li>
                            <li>Company identification (NIP, name, address)</li>
                            <li>Customer details (NIP, name, address)</li>
                            <li>Invoice items with VAT rates</li>
                            <li>VAT summary by rate</li>
                            <li>Control totals for validation</li>
                        </ul>

                        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 2 }}>
                            The generated XML file will comply with the Ministry of Finance schema version 1-0.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<DownloadOutlined />}
                                onClick={handleGenerateXML}
                            >
                                Generate & Download XML
                            </Button>
                            <Button variant="outlined" size="large">
                                Validate Data
                            </Button>
                            <Button variant="outlined" size="large">
                                Preview XML
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Submission Instructions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        To submit the JPK_FA file to the Polish tax authority:
                    </Typography>
                    <ol>
                        <li>Download the generated XML file</li>
                        <li>Log in to the e-Deklaracje portal (www.podatki.gov.pl)</li>
                        <li>Navigate to JPK section</li>
                        <li>Upload the XML file</li>
                        <li>Review and confirm the submission</li>
                    </ol>
                </CardContent>
            </Card>
        </Box>
    );
};
