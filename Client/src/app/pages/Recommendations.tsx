import { Box, Typography, CircularProgress, Alert, Paper, Grid, TableSortLabel, Chip, Link, TextField, InputAdornment } from '@mui/material';
import { useState, useMemo } from 'react';
import { useStockRecommendations, useStockSummary } from '../../lib/hooks/useStockRecommendations';
import type { StockRecommendation } from '../../lib/types/stockRecommendations';

type SortField = 'ticker' | 'name' | 'price' | 'change_7d_pct' | 'score' | 'sell_score' | 'recommendation' | 'owned_shares' | 'unrealized_profit_value' | 'unrealized_profit_pct' | 'benefit_description' | 'benefit_frequency' | 'yearly_roi' | 'daily_income' | 'current_yearly_roi' | 'current_daily_income' | 'next_block_yearly_roi' | 'next_block_daily_income' | 'next_block_cost';
type SortOrder = 'asc' | 'desc';

export default function Recommendations() {
    const { recommendationsData, recommendationsLoading, recommendationsError } = useStockRecommendations();
    const { summaryData, summaryLoading } = useStockSummary();
    const [sortField, setSortField] = useState<SortField>('score');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [extraMoney, setExtraMoney] = useState<number>(0);

    // Calculate money locked in stock blocks and available money
    const stockMoneyInfo = useMemo(() => {
        if (!recommendationsData) {
            return {
                totalValue: 0,
                lockedInBenefits: 0,
                availableInStocks: 0,
                totalAvailable: extraMoney
            };
        }
        
        let totalValue = 0;
        let lockedValue = 0;
        
        for (const stock of recommendationsData) {
            if (stock.owned_shares > 0) {
                const stockValue = stock.owned_shares * stock.price;
                totalValue += stockValue;
                
                if (stock.benefit_blocks_owned > 0 && stock.benefit_requirement) {
                    // Calculate total shares needed for all owned blocks
                    let totalSharesForBlocks = 0;
                    for (let i = 1; i <= stock.benefit_blocks_owned; i++) {
                        totalSharesForBlocks += stock.benefit_requirement * Math.pow(2, i - 1);
                    }
                    lockedValue += totalSharesForBlocks * stock.price;
                }
            }
        }
        
        const availableInStocks = totalValue - lockedValue;
        const totalAvailable = availableInStocks + extraMoney;
        
        return {
            totalValue,
            lockedInBenefits: lockedValue,
            availableInStocks,
            totalAvailable
        };
    }, [recommendationsData, extraMoney]);

    // Determine which stocks can be afforded with available money
    const affordabilityMap = useMemo(() => {
        if (!recommendationsData) return new Map<number, boolean>();
        
        const map = new Map<number, boolean>();
        
        for (const stock of recommendationsData) {
            // Use next_block_cost from API if available, otherwise can't afford
            const costForNextBlock = stock.next_block_cost || 0;
            
            // Can afford if total available money >= cost for next block
            map.set(stock.stock_id, costForNextBlock > 0 && stockMoneyInfo.totalAvailable >= costForNextBlock);
        }
        
        return map;
    }, [recommendationsData, stockMoneyInfo]);

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
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '-';
        const formatted = value.toFixed(2);
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
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Stock Recommendations
            </Typography>

            {/* Info Cards */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 2, flex: '1 1 200px', minWidth: '200px', border: 3, borderColor: 'primary.main' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Daily Income
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {summaryLoading ? '...' : formatCurrency(summaryData?.total_current_daily_income || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {summaryData?.stocks_with_benefits || 0} stocks with benefits
                    </Typography>
                </Paper>
                
                <Paper sx={{ p: 2, flex: '1 1 200px', minWidth: '200px' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Stocks
                    </Typography>
                    <Typography variant="h5">
                        {recommendationsData.length}
                    </Typography>
                </Paper>
                
                <Paper sx={{ p: 2, flex: '1 1 200px', minWidth: '200px' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Stock Value
                    </Typography>
                    <Typography variant="h6">
                        {formatCurrency(stockMoneyInfo.totalValue)}
                    </Typography>
                </Paper>
                
                <Paper sx={{ p: 2, flex: '1 1 200px', minWidth: '200px' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Locked in Benefits
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                        {formatCurrency(stockMoneyInfo.lockedInBenefits)}
                    </Typography>
                </Paper>
                
                <Paper sx={{ p: 2, flex: '1 1 200px', minWidth: '200px', border: 3, borderColor: 'success.main' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Available in Stocks
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(stockMoneyInfo.availableInStocks)}
                    </Typography>
                </Paper>
            </Box>

            {/* Extra Money Input */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    label="Extra Money Available"
                    type="number"
                    value={extraMoney}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtraMoney(Math.max(0, parseFloat(e.target.value) || 0))}
                    sx={{ width: '100%', maxWidth: 400 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Enter extra cash to see which stock blocks you can afford"
                />
                {extraMoney > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Total Available (Stocks + Extra): <strong>{formatCurrency(stockMoneyInfo.totalAvailable)}</strong>
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Paper sx={{ mt: 3, p: 2, overflow: 'hidden' }}>
                {/* Header Row */}
                <Grid container spacing={1} sx={{
                    mb: 2,
                    pb: 2,
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    bgcolor: 'action.hover'
                }}>
                    <Grid size={{ xs: 6, sm: 0.5 }}>
                        <TableSortLabel
                            active={sortField === 'ticker'}
                            direction={sortField === 'ticker' ? sortOrder : 'asc'}
                            onClick={() => handleSort('ticker')}
                        >
                            Ticker
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.0 }}>
                        <TableSortLabel
                            active={sortField === 'name'}
                            direction={sortField === 'name' ? sortOrder : 'asc'}
                            onClick={() => handleSort('name')}
                        >
                            Name
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.6 }}>
                        <TableSortLabel
                            active={sortField === 'price'}
                            direction={sortField === 'price' ? sortOrder : 'asc'}
                            onClick={() => handleSort('price')}
                        >
                            Price
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.6 }}>
                        <TableSortLabel
                            active={sortField === 'change_7d_pct'}
                            direction={sortField === 'change_7d_pct' ? sortOrder : 'asc'}
                            onClick={() => handleSort('change_7d_pct')}
                        >
                            7d Chg
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.5 }}>
                        <TableSortLabel
                            active={sortField === 'score'}
                            direction={sortField === 'score' ? sortOrder : 'asc'}
                            onClick={() => handleSort('score')}
                        >
                            Score
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.8 }}>
                        <TableSortLabel
                            active={sortField === 'recommendation'}
                            direction={sortField === 'recommendation' ? sortOrder : 'asc'}
                            onClick={() => handleSort('recommendation')}
                        >
                            Rec
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.5 }}>
                        <TableSortLabel
                            active={sortField === 'owned_shares'}
                            direction={sortField === 'owned_shares' ? sortOrder : 'asc'}
                            onClick={() => handleSort('owned_shares')}
                        >
                            Owned
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.5 }}>
                        <TableSortLabel
                            active={sortField === 'benefit_description'}
                            direction={sortField === 'benefit_description' ? sortOrder : 'asc'}
                            onClick={() => handleSort('benefit_description')}
                        >
                            Benefit
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.5 }}>
                        <TableSortLabel
                            active={sortField === 'benefit_frequency'}
                            direction={sortField === 'benefit_frequency' ? sortOrder : 'asc'}
                            onClick={() => handleSort('benefit_frequency')}
                        >
                            Days
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.7 }}>
                        <TableSortLabel
                            active={sortField === 'next_block_yearly_roi'}
                            direction={sortField === 'next_block_yearly_roi' ? sortOrder : 'asc'}
                            onClick={() => handleSort('next_block_yearly_roi')}
                        >
                            Next ROI
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.8 }}>
                        <TableSortLabel
                            active={sortField === 'next_block_daily_income'}
                            direction={sortField === 'next_block_daily_income' ? sortOrder : 'asc'}
                            onClick={() => handleSort('next_block_daily_income')}
                        >
                            Next Income
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.9 }}>
                        <TableSortLabel
                            active={sortField === 'next_block_cost'}
                            direction={sortField === 'next_block_cost' ? sortOrder : 'asc'}
                            onClick={() => handleSort('next_block_cost')}
                        >
                            Next Cost
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.7 }}>
                        <TableSortLabel
                            active={sortField === 'current_yearly_roi'}
                            direction={sortField === 'current_yearly_roi' ? sortOrder : 'asc'}
                            onClick={() => handleSort('current_yearly_roi')}
                        >
                            Current ROI
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.8 }}>
                        <TableSortLabel
                            active={sortField === 'current_daily_income'}
                            direction={sortField === 'current_daily_income' ? sortOrder : 'asc'}
                            onClick={() => handleSort('current_daily_income')}
                        >
                            Current Income
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.8 }}>
                        <TableSortLabel
                            active={sortField === 'unrealized_profit_value'}
                            direction={sortField === 'unrealized_profit_value' ? sortOrder : 'asc'}
                            onClick={() => handleSort('unrealized_profit_value')}
                        >
                            Profit $
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.6 }}>
                        <TableSortLabel
                            active={sortField === 'unrealized_profit_pct'}
                            direction={sortField === 'unrealized_profit_pct' ? sortOrder : 'asc'}
                            onClick={() => handleSort('unrealized_profit_pct')}
                        >
                            Profit %
                        </TableSortLabel>
                    </Grid>
                </Grid>

                {/* Data Rows */}
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                    {sortedData.map((stock: StockRecommendation) => {
                        const canAfford = affordabilityMap.get(stock.stock_id) || false;
                        
                        return (
                            <Grid
                                container
                                spacing={1}
                                key={stock.stock_id}
                                sx={{
                                    py: 1.5,
                                    px: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    borderLeft: canAfford ? '4px solid' : 'none',
                                    borderLeftColor: canAfford ? 'success.main' : 'transparent',
                                    transition: 'border-color 0.2s',
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <Grid size={{ xs: 6, sm: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{stock.ticker}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.0 }}>
                                    <Link
                                        href={getTornStockUrl(stock.stock_id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{stock.name}</Typography>
                                    </Link>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.6 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatCurrency(stock.price)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.6 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.change_7d_pct && stock.change_7d_pct > 0 ? 'success.main' : stock.change_7d_pct && stock.change_7d_pct < 0 ? 'error.main' : 'inherit'
                                        }}
                                    >
                                        {formatPercent(stock.change_7d_pct)}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.score && stock.score > 0 ? 'success.main' : stock.score && stock.score < 0 ? 'error.main' : 'inherit',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {formatNumber(stock.score)}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.8 }}>
                                    <Chip
                                        label={stock.recommendation}
                                        color={getRecommendationColor(stock.recommendation)}
                                        size="small"
                                        sx={{ fontSize: '0.65rem', height: '20px' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                        {stock.owned_shares > 0 ? stock.owned_shares.toLocaleString() : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                                        {stock.benefit_description || '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                        {stock.benefit_frequency ? `${stock.benefit_frequency}d` : stock.benefit_type === 'Passive' ? 'Passive' : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.7 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.next_block_yearly_roi && stock.next_block_yearly_roi > 0 ? 'info.main' : 'inherit',
                                            fontWeight: stock.next_block_yearly_roi ? 'bold' : 'normal'
                                        }}
                                    >
                                        {stock.next_block_yearly_roi !== null && stock.next_block_yearly_roi !== undefined ? `${stock.next_block_yearly_roi.toFixed(1)}%` : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.8 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.next_block_daily_income && stock.next_block_daily_income > 0 ? 'info.main' : 'inherit',
                                            fontWeight: stock.next_block_daily_income ? 'bold' : 'normal'
                                        }}
                                    >
                                        {stock.next_block_daily_income !== null && stock.next_block_daily_income !== undefined ? formatCurrency(stock.next_block_daily_income) : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.9 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.next_block_cost && stock.next_block_cost > 0 ? 'warning.main' : 'inherit',
                                            fontWeight: stock.next_block_cost ? 'bold' : 'normal'
                                        }}
                                    >
                                        {stock.next_block_cost !== null && stock.next_block_cost !== undefined ? formatCurrency(stock.next_block_cost) : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.7 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.current_yearly_roi && stock.current_yearly_roi > 0 ? 'primary.main' : 'inherit',
                                            fontWeight: stock.current_yearly_roi ? 'bold' : 'normal'
                                        }}
                                    >
                                        {stock.current_yearly_roi !== null && stock.current_yearly_roi !== undefined ? `${stock.current_yearly_roi.toFixed(1)}%` : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.8 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.current_daily_income && stock.current_daily_income > 0 ? 'primary.main' : 'inherit',
                                            fontWeight: stock.current_daily_income ? 'bold' : 'normal'
                                        }}
                                    >
                                        {stock.current_daily_income !== null && stock.current_daily_income !== undefined ? formatCurrency(stock.current_daily_income) : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.8 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.unrealized_profit_value && stock.unrealized_profit_value > 0 ? 'success.main' : stock.unrealized_profit_value && stock.unrealized_profit_value < 0 ? 'error.main' : 'inherit',
                                            fontWeight: stock.unrealized_profit_value !== null ? 'bold' : 'normal'
                                        }}
                                    >
                                        {stock.unrealized_profit_value !== null && stock.unrealized_profit_value !== undefined ? formatCurrency(stock.unrealized_profit_value) : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.6 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: stock.unrealized_profit_pct && stock.unrealized_profit_pct > 0 ? 'success.main' : stock.unrealized_profit_pct && stock.unrealized_profit_pct < 0 ? 'error.main' : 'inherit',
                                            fontWeight: stock.unrealized_profit_pct !== null && stock.unrealized_profit_pct !== undefined ? 'bold' : 'normal'
                                        }}
                                    >
                                        {formatPercent(stock.unrealized_profit_pct)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        );
                    })}
                </Box>
            </Paper>
        </Box>
    );
}

