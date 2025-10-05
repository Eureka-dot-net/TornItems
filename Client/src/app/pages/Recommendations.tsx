import { Box, Typography, CircularProgress, Alert, Paper, Grid, TableSortLabel, Chip, Link } from '@mui/material';
import { useState, useMemo } from 'react';
import { useStockRecommendations } from '../../lib/hooks/useStockRecommendations';
import type { StockRecommendation } from '../../lib/types/stockRecommendations';

type SortField = 'ticker' | 'name' | 'price' | 'change_7d' | 'volatility' | 'score' | 'sell_score' | 'recommendation' | 'owned_shares';
type SortOrder = 'asc' | 'desc';

export default function Recommendations() {
    const { recommendationsData, recommendationsLoading, recommendationsError } = useStockRecommendations();
    const [sortField, setSortField] = useState<SortField>('score');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Sort the data based on current sort field and order
    const sortedData = useMemo(() => {
        if (!recommendationsData) return [];
        
        const data = [...recommendationsData];
        data.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            // For strings, use locale compare
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // For numbers
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return 0;
        });
        return data;
    }, [recommendationsData, sortField, sortOrder]);

    if (recommendationsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (recommendationsError) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Error loading stock recommendations: {recommendationsError instanceof Error ? recommendationsError.message : 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    if (!recommendationsData || recommendationsData.length === 0) {
        return (
            <Box p={3}>
                <Alert severity="info">No stock recommendations available</Alert>
            </Box>
        );
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const formatCurrency = (value: number | null | undefined) => {
        return value !== null && value !== undefined ? `$${value.toFixed(2)}` : '-';
    };

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '-';
        const formatted = (value * 100).toFixed(2);
        return value >= 0 ? `+${formatted}%` : `${formatted}%`;
    };

    const formatNumber = (value: number | null | undefined) => {
        return value !== null && value !== undefined ? value.toFixed(2) : '-';
    };

    const getRecommendationColor = (recommendation: string): 'success' | 'info' | 'default' | 'warning' | 'error' => {
        switch (recommendation) {
            case 'STRONG_BUY':
                return 'success';
            case 'BUY':
                return 'info';
            case 'HOLD':
                return 'default';
            case 'SELL':
                return 'warning';
            case 'STRONG_SELL':
                return 'error';
            default:
                return 'default';
        }
    };

    const getTornStockUrl = (stockId: number) => {
        return `https://www.torn.com/page.php?sid=stocks&stockID=${stockId}&tab=owned`;
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Stock Recommendations
            </Typography>

            <Typography variant="body1" gutterBottom>
                Total Stocks: {recommendationsData.length}
            </Typography>

            <Paper sx={{ mt: 3, p: 2 }}>
                {/* Header Row */}
                <Grid container spacing={2} sx={{
                    mb: 2,
                    pb: 2,
                    borderBottom: '2px solid #555',
                    fontWeight: 'bold'
                }}>
                    <Grid size={{ xs: 6, sm: 1 }}>
                        <TableSortLabel
                            active={sortField === 'ticker'}
                            direction={sortField === 'ticker' ? sortOrder : 'asc'}
                            onClick={() => handleSort('ticker')}
                        >
                            Ticker
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TableSortLabel
                            active={sortField === 'name'}
                            direction={sortField === 'name' ? sortOrder : 'asc'}
                            onClick={() => handleSort('name')}
                        >
                            Name
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.2 }}>
                        <TableSortLabel
                            active={sortField === 'price'}
                            direction={sortField === 'price' ? sortOrder : 'asc'}
                            onClick={() => handleSort('price')}
                        >
                            Price
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.2 }}>
                        <TableSortLabel
                            active={sortField === 'change_7d'}
                            direction={sortField === 'change_7d' ? sortOrder : 'asc'}
                            onClick={() => handleSort('change_7d')}
                        >
                            7d Change
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.2 }}>
                        <TableSortLabel
                            active={sortField === 'volatility'}
                            direction={sortField === 'volatility' ? sortOrder : 'asc'}
                            onClick={() => handleSort('volatility')}
                        >
                            Volatility
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1 }}>
                        <TableSortLabel
                            active={sortField === 'score'}
                            direction={sortField === 'score' ? sortOrder : 'asc'}
                            onClick={() => handleSort('score')}
                        >
                            Score
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.5 }}>
                        <TableSortLabel
                            active={sortField === 'recommendation'}
                            direction={sortField === 'recommendation' ? sortOrder : 'asc'}
                            onClick={() => handleSort('recommendation')}
                        >
                            Recommendation
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.2 }}>
                        <TableSortLabel
                            active={sortField === 'owned_shares'}
                            direction={sortField === 'owned_shares' ? sortOrder : 'asc'}
                            onClick={() => handleSort('owned_shares')}
                        >
                            Owned
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1.7 }}>
                        <Typography variant="body2">Action</Typography>
                    </Grid>
                </Grid>

                {/* Data Rows */}
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                    {sortedData.map((stock: StockRecommendation) => (
                        <Grid
                            container
                            spacing={2}
                            key={stock.stock_id}
                            sx={{
                                py: 1.5,
                                borderBottom: '1px solid #333',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            <Grid size={{ xs: 6, sm: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stock.ticker}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 2 }}>
                                <Typography variant="body2">{stock.name}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.2 }}>
                                <Typography variant="body2">{formatCurrency(stock.price)}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.2 }}>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: stock.change_7d && stock.change_7d > 0 ? '#f44336' : stock.change_7d && stock.change_7d < 0 ? '#4caf50' : 'inherit'
                                    }}
                                >
                                    {formatPercent(stock.change_7d)}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.2 }}>
                                <Typography variant="body2">{formatNumber(stock.volatility)}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1 }}>
                                <Typography 
                                    variant="body2"
                                    sx={{ 
                                        color: stock.score && stock.score > 0 ? '#4caf50' : stock.score && stock.score < 0 ? '#f44336' : 'inherit',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {formatNumber(stock.score)}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.5 }}>
                                <Chip 
                                    label={stock.recommendation} 
                                    color={getRecommendationColor(stock.recommendation)}
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 1.2 }}>
                                <Typography variant="body2">{stock.owned_shares}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 1.7 }}>
                                <Link 
                                    href={getTornStockUrl(stock.stock_id)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    sx={{ fontSize: '0.875rem' }}
                                >
                                    View in Torn
                                </Link>
                            </Grid>
                        </Grid>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
}
