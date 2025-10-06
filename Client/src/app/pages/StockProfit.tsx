import { Box, Typography, CircularProgress, Alert, Paper, Grid, Chip } from '@mui/material';
import { useMemo } from 'react';
import { useStockTransactions } from '../../lib/hooks/useStockTransactions';
import type { StockTransaction } from '../../lib/types/stockTransactions';

export default function StockProfit() {
    const { transactionsData, transactionsLoading, transactionsError } = useStockTransactions();

    // Calculate running total
    const runningTotal = useMemo(() => {
        if (!transactionsData) return 0;
        return transactionsData.reduce((total, transaction) => {
            return total + (transaction.total_profit || 0);
        }, 0);
    }, [transactionsData]);

    if (transactionsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (transactionsError) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Error loading stock transactions: {transactionsError instanceof Error ? transactionsError.message : 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    if (!transactionsData || transactionsData.length === 0) {
        return (
            <Box p={3}>
                <Alert severity="info">No transactions yet</Alert>
            </Box>
        );
    }

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatNumber = (value: number | null | undefined) => {
        return value !== null && value !== undefined ? value.toFixed(2) : '-';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionColor = (action: string): 'success' | 'error' => {
        return action === 'BUY' ? 'success' : 'error';
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Stock Profit/Loss History
            </Typography>

            <Typography variant="body1" gutterBottom>
                Total Transactions: {transactionsData.length}
            </Typography>

            <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                    color: runningTotal >= 0 ? '#4caf50' : '#f44336',
                    fontWeight: 'bold'
                }}
            >
                Total Realized Profit: {formatCurrency(runningTotal)}
            </Typography>

            <Paper sx={{ mt: 3, p: 2 }}>
                {/* Header Row */}
                <Grid container spacing={2} sx={{
                    mb: 2,
                    pb: 2,
                    borderBottom: '2px solid #555',
                    fontWeight: 'bold'
                }}>
                    <Grid size={{ xs: 12, sm: 1.5 }}>Date</Grid>
                    <Grid size={{ xs: 4, sm: 0.8 }}>Ticker</Grid>
                    <Grid size={{ xs: 4, sm: 0.8 }}>Action</Grid>
                    <Grid size={{ xs: 4, sm: 1 }}>Shares</Grid>
                    <Grid size={{ xs: 4, sm: 1 }}>Price</Grid>
                    <Grid size={{ xs: 4, sm: 1.2 }}>Profit</Grid>
                    <Grid size={{ xs: 4, sm: 0.8 }}>Buy Score</Grid>
                    <Grid size={{ xs: 6, sm: 1.2 }}>Buy Rec</Grid>
                    <Grid size={{ xs: 4, sm: 0.8 }}>Sale Score</Grid>
                    <Grid size={{ xs: 6, sm: 1.2 }}>Sale Rec</Grid>
                </Grid>

                {/* Data Rows */}
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                    {transactionsData.map((transaction: StockTransaction) => (
                        <Grid
                            container
                            spacing={2}
                            key={transaction._id}
                            sx={{
                                py: 1.5,
                                borderBottom: '1px solid #333',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            <Grid size={{ xs: 12, sm: 1.5 }}>
                                <Typography variant="body2">{formatDate(transaction.time)}</Typography>
                            </Grid>
                            <Grid size={{ xs: 4, sm: 0.8 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{transaction.ticker}</Typography>
                            </Grid>
                            <Grid size={{ xs: 4, sm: 0.8 }}>
                                <Chip
                                    label={transaction.action}
                                    color={getActionColor(transaction.action)}
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                />
                            </Grid>
                            <Grid size={{ xs: 4, sm: 1 }}>
                                <Typography variant="body2">{transaction.shares.toLocaleString()}</Typography>
                            </Grid>
                            <Grid size={{ xs: 4, sm: 1 }}>
                                <Typography variant="body2">{formatCurrency(transaction.price)}</Typography>
                            </Grid>
                            <Grid size={{ xs: 4, sm: 1.2 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: transaction.total_profit && transaction.total_profit > 0 ? '#4caf50' : transaction.total_profit && transaction.total_profit < 0 ? '#f44336' : 'inherit',
                                        fontWeight: transaction.total_profit !== null ? 'bold' : 'normal'
                                    }}
                                >
                                    {transaction.total_profit !== null ? formatCurrency(transaction.total_profit) : '-'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 4, sm: 0.8 }}>
                                <Typography variant="body2">{formatNumber(transaction.score_at_buy)}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.2 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {transaction.recommendation_at_buy || '-'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 4, sm: 0.8 }}>
                                <Typography variant="body2">{formatNumber(transaction.score_at_sale)}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.2 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {transaction.recommendation_at_sale || '-'}
                                </Typography>
                            </Grid>
                        </Grid>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
}
