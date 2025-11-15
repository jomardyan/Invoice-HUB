import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });

        // Log to error tracking service (e.g., Sentry)
        // Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '400px',
                        p: 3,
                    }}
                >
                    <Card sx={{ maxWidth: 600, width: '100%' }}>
                        <CardContent sx={{ textAlign: 'center', p: 4 }}>
                            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

                            <Typography variant="h5" gutterBottom>
                                Oops! Something went wrong
                            </Typography>

                            <Typography variant="body1" color="text.secondary" paragraph>
                                We're sorry for the inconvenience. An unexpected error has occurred.
                            </Typography>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Box
                                    sx={{
                                        mt: 3,
                                        p: 2,
                                        bgcolor: 'grey.100',
                                        borderRadius: 1,
                                        textAlign: 'left',
                                        overflow: 'auto',
                                        maxHeight: 200,
                                    }}
                                >
                                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                                        {this.state.error.toString()}
                                        {this.state.errorInfo && (
                                            <>
                                                {'\n\n'}
                                                {this.state.errorInfo.componentStack}
                                            </>
                                        )}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={this.handleReset}
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => window.location.href = '/'}
                                >
                                    Go to Home
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return this.props.children;
    }
}
