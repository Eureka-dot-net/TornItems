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
        let lockedInPassiveBenefits = 0;
        let availableValue = 0;
        
        for (const stock of recommendationsData) {
            if (stock.owned_shares > 0) {
                const stockValue = stock.owned_shares * stock.price;
                totalValue += stockValue;
                
                // Check if this is a passive benefit stock (benefits like speed boosts, discounts, etc.)
                // Only Passive stocks should have their shares locked for benefits
                const isPassiveBenefit = stock.benefit_type === 'Passive';
                
                if (isPassiveBenefit && stock.benefit_blocks_owned > 0 && stock.benefit_requirement) {
                    // For passive benefit stocks, lock all shares needed for owned blocks
                    let totalSharesForBlocks = 0;
                    for (let i = 1; i <= stock.benefit_blocks_owned; i++) {
                        totalSharesForBlocks += stock.benefit_requirement * Math.pow(2, i - 1);
                    }
                    const lockedValue = totalSharesForBlocks * stock.price;
                    lockedInPassiveBenefits += lockedValue;
                    
                    // Any shares beyond what's needed for blocks are available
                    const excessShares = stock.owned_shares - totalSharesForBlocks;
                    if (excessShares > 0) {
                        availableValue += excessShares * stock.price;
                    }
                    // If excessShares is negative, it indicates data inconsistency
                    // but we don't add negative value to availableValue
                } else {
                    // For Active stocks (money/items) or stocks without benefit blocks, all value is available
                    availableValue += stockValue;
                }
            }
        }
        
        const totalAvailable = availableValue + extraMoney;
        
        return {
            totalValue,
            lockedInBenefits: lockedInPassiveBenefits,
            availableInStocks: availableValue,
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

    // Calculate current daily income from Active stocks (that contribute to available money)
    const currentActiveIncome = useMemo(() => {
        if (!recommendationsData) return 0;
        
        let income = 0;
        for (const stock of recommendationsData) {
            if (stock.owned_shares > 0 && stock.benefit_type === 'Active' && 
                stock.current_daily_income !== null && stock.current_daily_income !== undefined) {
                income += stock.current_daily_income;
            }
        }
        return income;
    }, [recommendationsData]);

    // Calculate investment suggestions based on available money
    // Algorithm: Find best use of total available money using first blocks AND additional blocks
    const investmentSuggestions = useMemo(() => {
        if (!recommendationsData || stockMoneyInfo.totalAvailable <= 0) return [];
        
        // Calculate current income from Active stocks
        let currentIncomeFromActiveStocks = 0;
        const currentHoldings = new Map<string, number>(); // ticker -> number of blocks owned
        
        for (const stock of recommendationsData) {
            if (stock.owned_shares > 0 && stock.benefit_type === 'Active') {
                if (stock.benefit_blocks_owned && stock.benefit_blocks_owned > 0) {
                    currentHoldings.set(stock.ticker, stock.benefit_blocks_owned);
                }
                if (stock.current_daily_income !== null && stock.current_daily_income !== undefined) {
                    currentIncomeFromActiveStocks += stock.current_daily_income;
                }
            }
        }
        
        // Build ALL possible block purchases (first blocks AND additional blocks)
        const allBlockCandidates: Array<{
            ticker: string;
            name: string;
            roi: number;
            income: number;
            cost: number;
            blockNumber: number;
            efficiency: number;
        }> = [];
        
        for (const s of recommendationsData) {
            if (!s.benefit_requirement || s.benefit_requirement <= 0) continue;
            
            // Add first block
            if (s.yearly_roi != null && s.daily_income != null) {
                const firstBlockCost = s.benefit_requirement * s.price;
                if (firstBlockCost > 0 && firstBlockCost <= stockMoneyInfo.totalAvailable) {
                    allBlockCandidates.push({
                        ticker: s.ticker,
                        name: s.name,
                        roi: s.yearly_roi,
                        income: s.daily_income,
                        cost: firstBlockCost,
                        blockNumber: 1,
                        efficiency: s.daily_income / firstBlockCost
                    });
                }
            }
            
            // Add next block if it exists and is affordable
            if (s.next_block_yearly_roi != null && s.next_block_daily_income != null && s.next_block_cost != null) {
                if (s.next_block_cost > 0 && s.next_block_cost <= stockMoneyInfo.totalAvailable) {
                    allBlockCandidates.push({
                        ticker: s.ticker,
                        name: s.name,
                        roi: s.next_block_yearly_roi,
                        income: s.next_block_daily_income,
                        cost: s.next_block_cost,
                        blockNumber: (s.benefit_blocks_owned || 0) + 1,
                        efficiency: s.next_block_daily_income / s.next_block_cost
                    });
                }
            }
        }
        
        if (allBlockCandidates.length === 0) return [];
        
        // Sort by efficiency (daily income per dollar) descending
        allBlockCandidates.sort((a, b) => b.efficiency - a.efficiency);
        
        // Greedy knapsack: pick best blocks (can pick multiple blocks of same stock)
        const selected: typeof allBlockCandidates = [];
        const stockBlockCount = new Map<string, number>(); // Track how many blocks of each stock
        let remainingBudget = stockMoneyInfo.totalAvailable;
        
        for (const candidate of allBlockCandidates) {
            const currentBlockCount = stockBlockCount.get(candidate.ticker) || 0;
            
            // Can only buy blocks sequentially (block 2 requires owning block 1, etc.)
            if (candidate.blockNumber === currentBlockCount + 1 && candidate.cost <= remainingBudget) {
                selected.push(candidate);
                remainingBudget -= candidate.cost;
                stockBlockCount.set(candidate.ticker, currentBlockCount + 1);
            }
        }
        
        if (selected.length === 0) return [];
        
        // Calculate total income from suggestions
        const suggestedIncome = selected.reduce((sum, s) => sum + s.income, 0);
        
        // Only show suggestions if they're better than or equal to current holdings
        if (currentIncomeFromActiveStocks > 0 && suggestedIncome < currentIncomeFromActiveStocks) {
            return []; // Current holdings are better
        }
        
        // Calculate actions: Keep, Buy, Sell
        const suggestedHoldings = new Map<string, number>();
        for (const s of selected) {
            suggestedHoldings.set(s.ticker, stockBlockCount.get(s.ticker) || 0);
        }
        
        const actions: {
            keep: Array<{ticker: string; name: string; blocks: number}>;
            buy: Array<{ticker: string; name: string; blockNumber: number}>;
            sell: Array<{ticker: string; name: string; blocks: number | 'all'}>;
        } = {
            keep: [],
            buy: [],
            sell: []
        };
        
        // Find stocks to keep and buy
        for (const [ticker, suggestedBlocks] of suggestedHoldings.entries()) {
            const currentBlocks = currentHoldings.get(ticker) || 0;
            const stockName = selected.find(s => s.ticker === ticker)?.name || ticker;
            
            if (currentBlocks > 0 && currentBlocks <= suggestedBlocks) {
                // Keep current blocks
                actions.keep.push({ ticker, name: stockName, blocks: currentBlocks });
                
                // Buy additional blocks if needed
                for (let i = currentBlocks + 1; i <= suggestedBlocks; i++) {
                    actions.buy.push({ ticker, name: stockName, blockNumber: i });
                }
            } else if (currentBlocks === 0) {
                // Buy all blocks (new stock)
                for (let i = 1; i <= suggestedBlocks; i++) {
                    actions.buy.push({ ticker, name: stockName, blockNumber: i });
                }
            } else if (currentBlocks > suggestedBlocks) {
                // Keep some blocks, sell the rest
                if (suggestedBlocks > 0) {
                    actions.keep.push({ ticker, name: stockName, blocks: suggestedBlocks });
                    actions.sell.push({ ticker, name: stockName, blocks: currentBlocks - suggestedBlocks });
                } else {
                    actions.sell.push({ ticker, name: stockName, blocks: 'all' });
                }
            }
        }
        
        // Find stocks to sell (not in suggestions but currently owned)
        for (const [ticker] of currentHoldings.entries()) {
            if (!suggestedHoldings.has(ticker)) {
                const stock = recommendationsData.find((s: any) => s.ticker === ticker);
                actions.sell.push({ 
                    ticker, 
                    name: stock?.name || ticker, 
                    blocks: 'all' 
                });
            }
        }
        
        // Return sorted by income descending, with actions attached
        return selected.sort((a, b) => b.income - a.income).map(s => ({ ...s, actions }));
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

    const formatAbbreviatedNumber = (value: number | null | undefined) => {
        if (value === null || value === undefined || value === 0) return '-';
        
        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        
        if (absValue >= 1_000_000_000) {
            return `${sign}${(absValue / 1_000_000_000).toFixed(1)}b`;
        } else if (absValue >= 1_000_000) {
            return `${sign}${(absValue / 1_000_000).toFixed(1)}m`;
        } else if (absValue >= 1_000) {
            return `${sign}${(absValue / 1_000).toFixed(1)}k`;
        }
        return value.toLocaleString();
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
                {investmentSuggestions.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, border: 3, borderColor: 'info.main', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            💡 Investment Suggestions
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Optimal combination to maximize daily income within your budget: <strong>{formatCurrency(investmentSuggestions.reduce((sum, s) => sum + s.income, 0))}/day</strong>
                        </Typography>
                        {currentActiveIncome > 0 && stockMoneyInfo.availableInStocks > 0 && (
                            <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Current income from Active stocks: <strong>{formatCurrency(currentActiveIncome)}/day</strong>
                                </Typography>
                                <Typography variant="body2" color={
                                    investmentSuggestions.reduce((sum, s) => sum + s.income, 0) > currentActiveIncome 
                                    ? 'success.main' 
                                    : investmentSuggestions.reduce((sum, s) => sum + s.income, 0) === currentActiveIncome
                                    ? 'info.main'
                                    : 'warning.main'
                                }>
                                    {investmentSuggestions.reduce((sum, s) => sum + s.income, 0) > currentActiveIncome 
                                        ? `✓ Net gain: ${formatCurrency(investmentSuggestions.reduce((sum, s) => sum + s.income, 0) - currentActiveIncome)}/day` 
                                        : investmentSuggestions.reduce((sum, s) => sum + s.income, 0) === currentActiveIncome
                                        ? `= Current holdings are optimal`
                                        : `⚠ Net loss: ${formatCurrency(investmentSuggestions.reduce((sum, s) => sum + s.income, 0) - currentActiveIncome)}/day`
                                    }
                                </Typography>
                            </Box>
                        )}
                        
                        {/* Show recommended actions */}
                        {investmentSuggestions.length > 0 && investmentSuggestions[0].actions && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    📋 Recommended Actions
                                </Typography>
                                
                                {/* Keep */}
                                {investmentSuggestions[0].actions.keep.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main', mb: 0.5 }}>
                                            Keep:
                                        </Typography>
                                        {investmentSuggestions[0].actions.keep.map((item) => (
                                            <Typography key={item.ticker} variant="body2" sx={{ ml: 2 }}>
                                                • <strong>{item.ticker}</strong> ({item.name}) - {item.blocks} block{item.blocks > 1 ? 's' : ''}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                                
                                {/* Buy */}
                                {investmentSuggestions[0].actions.buy.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', mb: 0.5 }}>
                                            Buy:
                                        </Typography>
                                        {investmentSuggestions[0].actions.buy.map((item, idx) => (
                                            <Typography key={`${item.ticker}-${idx}`} variant="body2" sx={{ ml: 2 }}>
                                                • <strong>{item.ticker}</strong> ({item.name}) - Block #{item.blockNumber}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                                
                                {/* Sell */}
                                {investmentSuggestions[0].actions.sell.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main', mb: 0.5 }}>
                                            Sell:
                                        </Typography>
                                        {investmentSuggestions[0].actions.sell.map((item) => (
                                            <Typography key={item.ticker} variant="body2" sx={{ ml: 2 }}>
                                                • <strong>{item.ticker}</strong> ({item.name}) - {item.blocks === 'all' ? 'All blocks' : `${item.blocks} block${typeof item.blocks === 'number' && item.blocks > 1 ? 's' : ''}`}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                        
                        {investmentSuggestions.map((suggestion, index) => (
                            <Box key={suggestion.ticker} sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                    {index + 1}. <strong>{suggestion.ticker}</strong> ({suggestion.name}) - Block #{suggestion.blockNumber}
                                    {' • '}ROI: <strong>{suggestion.roi.toFixed(1)}%</strong>
                                    {' • '}Income: <strong>{formatCurrency(suggestion.income)}/day</strong>
                                    {' • '}Cost: <strong>{formatCurrency(suggestion.cost)}</strong>
                                </Typography>
                            </Box>
                        ))}
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
                    <Grid size={{ xs: 6, sm: 0.6 }}>
                        <TableSortLabel
                            active={sortField === 'recommendation'}
                            direction={sortField === 'recommendation' ? sortOrder : 'asc'}
                            onClick={() => handleSort('recommendation')}
                        >
                            Rec
                        </TableSortLabel>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 0.7 }}>
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
                                <Grid size={{ xs: 6, sm: 0.6 }}>
                                    <Chip
                                        label={stock.recommendation}
                                        color={getRecommendationColor(stock.recommendation)}
                                        size="small"
                                        sx={{ fontSize: '0.65rem', height: '20px' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 0.7 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                        {stock.owned_shares > 0 ? formatAbbreviatedNumber(stock.owned_shares) : '-'}
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
                                        {stock.next_block_daily_income !== null && stock.next_block_daily_income !== undefined ? `$${formatAbbreviatedNumber(stock.next_block_daily_income)}` : '-'}
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
                                        {stock.next_block_cost !== null && stock.next_block_cost !== undefined ? `$${formatAbbreviatedNumber(stock.next_block_cost)}` : '-'}
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
                                        {stock.current_daily_income !== null && stock.current_daily_income !== undefined ? `$${formatAbbreviatedNumber(stock.current_daily_income)}` : '-'}
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
                                        {stock.unrealized_profit_value !== null && stock.unrealized_profit_value !== undefined ? `$${formatAbbreviatedNumber(stock.unrealized_profit_value)}` : '-'}
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

