import { Box, Typography, CircularProgress, Alert, Tabs, Tab, Paper, Grid, TableSortLabel, Link } from '@mui/material';
import { useState, useMemo } from 'react';
import { useProfit } from '../../lib/hooks/useProfit';
import type { CountryItem } from '../../lib/types/profit';

type SortField = 'name' | 'shop_name' | 'country' | 'buy_price' | 'average_price_items_sold' | 'sold_profit' | 'sales_24h_current' | 'profit_per_minute' | 'travel_time_minutes';
type SortOrder = 'asc' | 'desc';

export default function Profit() {
    const { profitData, profitLoading, profitError } = useProfit();
    const [selectedCountry, setSelectedCountry] = useState<string>('Torn');
    const [sortField, setSortField] = useState<SortField>('sold_profit');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const countries = profitData?.results ? Object.keys(profitData.results).sort((a, b) => {
        // Torn first
        if (a === 'Torn') return -1;
        if (b === 'Torn') return 1;
        // Then alphabetical
        return a.localeCompare(b);
    }) : [];

    // Group all foreign countries (non-Torn) for the "Foreign" tab
    const foreignCountries = countries.filter(c => c !== 'Torn');
    const foreignItems = useMemo(() => {
        if (!profitData?.results) return [];
        return foreignCountries.flatMap(country => profitData.results[country] || []);
    }, [profitData, foreignCountries]);

    const rawData = useMemo(() => {
        if (selectedCountry === 'Foreign') {
            return foreignItems;
        }
        return profitData?.results?.[selectedCountry] || [];
    }, [profitData, selectedCountry, foreignItems]);

    // Sort the data based on current sort field and order
    const sortedData = useMemo(() => {
        const data = [...rawData];
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
    }, [rawData, sortField, sortOrder]);

    if (profitLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (profitError) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Error loading profit data: {profitError instanceof Error ? profitError.message : 'Unknown error'}
                </Alert>
            </Box>
        );
    }

    if (!profitData || !profitData.results) {
        return (
            <Box p={3}>
                <Alert severity="info">No profit data available</Alert>
            </Box>
        );
    }

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        setSelectedCountry(newValue);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const formatCurrency = (value: number | null | undefined) => {
        return value !== null && value !== undefined ? `$${value.toLocaleString()}` : '-';
    };

    const formatNumber = (value: number | null | undefined) => {
        return value !== null && value !== undefined ? value.toLocaleString() : '-';
    };

    const formatDuration = (minutes: number | null | undefined) => {
        if (minutes == null) return '-';

        // Round to two decimal places
        const rounded = Math.round(minutes * 100) / 100;

        if (rounded < 60) return `${rounded}m`;

        const hours = Math.floor(rounded / 60);
        const mins = +(rounded % 60).toFixed(2); // keep two decimals

        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatDateTime = (isoString: string | null | undefined) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        const now = new Date();

        // Start of today and tomorrow for comparison
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const dayAfterStart = new Date(tomorrowStart);
        dayAfterStart.setDate(dayAfterStart.getDate() + 1);

        // Format time in 24-hour format
        const timeStr = date.toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,       // ← key change: forces 24-hour format
        });

        // If it's tomorrow
        if (date >= tomorrowStart && date < dayAfterStart) {
            return `+1d ${timeStr}`;
        }

        // Otherwise (today / past)
        return timeStr;
    };

    const buildTornShopUrl = (item: CountryItem) => {
        if (!item.shop_url_name) return null;
        
        // Build the URL with step, itemid, and buyamount parameters
        return `https://www.torn.com/shops.php?step=${item.shop_url_name}&itemid=${item.id}&buyamount=100`;
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Profit Analysis
            </Typography>

            <Typography variant="body1" gutterBottom>
                Total Items: {profitData.count} | Countries: {profitData.countries}
            </Typography>

            <Paper sx={{ mt: 3 }}>
                <Tabs
                    value={selectedCountry}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {/* Torn tab first */}
                    {countries.includes('Torn') && (
                        <Tab
                            key="Torn"
                            label={`Torn (${profitData.results['Torn']?.length || 0})`}
                            value="Torn"
                        />
                    )}
                    {/* Foreign tab for all foreign countries combined */}
                    {foreignCountries.length > 0 && (
                        <Tab
                            key="Foreign"
                            label={`Foreign (${foreignItems.length})`}
                            value="Foreign"
                        />
                    )}
                    {/* Individual country tabs */}
                    {foreignCountries.map((country) => (
                        <Tab
                            key={country}
                            label={`${country} (${profitData.results[country].length})`}
                            value={country}
                        />
                    ))}
                </Tabs>
            </Paper>

            <Paper sx={{ mt: 3, p: 2 }}>
                {/* Header Row */}
                {(selectedCountry === 'Foreign' || (selectedCountry !== 'Torn' && selectedCountry !== 'Unknown')) ? (
                    // Foreign stock headers
                    <Grid container spacing={2} sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: '2px solid #555',
                        fontWeight: 'bold'
                    }}>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                            <TableSortLabel
                                active={sortField === 'name'}
                                direction={sortField === 'name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Name
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1.5 }}>
                            <TableSortLabel
                                active={sortField === 'country'}
                                direction={sortField === 'country' ? sortOrder : 'asc'}
                                onClick={() => handleSort('country')}
                            >
                                Country
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.2 }}>
                            <TableSortLabel
                                active={sortField === 'buy_price'}
                                direction={sortField === 'buy_price' ? sortOrder : 'asc'}
                                onClick={() => handleSort('buy_price')}
                            >
                                Buy Price
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.2 }}>
                            <TableSortLabel
                                active={sortField === 'average_price_items_sold'}
                                direction={sortField === 'average_price_items_sold' ? sortOrder : 'asc'}
                                onClick={() => handleSort('average_price_items_sold')}
                            >
                                Avg Sold
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.3 }}>
                            <TableSortLabel
                                active={sortField === 'sold_profit'}
                                direction={sortField === 'sold_profit' ? sortOrder : 'asc'}
                                onClick={() => handleSort('sold_profit')}
                            >
                                Sold Profit
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.3 }}>
                            <TableSortLabel
                                active={sortField === 'travel_time_minutes'}
                                direction={sortField === 'travel_time_minutes' ? sortOrder : 'asc'}
                                onClick={() => handleSort('travel_time_minutes')}
                            >
                                Travel Time
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.5 }}>
                            <TableSortLabel
                                active={sortField === 'profit_per_minute'}
                                direction={sortField === 'profit_per_minute' ? sortOrder : 'asc'}
                                onClick={() => handleSort('profit_per_minute')}
                            >
                                Profit/Min
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.5 }}>
                            <TableSortLabel
                                active={sortField === 'sales_24h_current'}
                                direction={sortField === 'sales_24h_current' ? sortOrder : 'asc'}
                                onClick={() => handleSort('sales_24h_current')}
                            >
                                24h Sales
                            </TableSortLabel>
                        </Grid>
                    </Grid>
                ) : (
                    // Torn stock headers
                    <Grid container spacing={2} sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: '2px solid #555',
                        fontWeight: 'bold'
                    }}>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                            <TableSortLabel
                                active={sortField === 'name'}
                                direction={sortField === 'name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Name
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1.5 }}>
                            <TableSortLabel
                                active={sortField === 'shop_name'}
                                direction={sortField === 'shop_name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('shop_name')}
                            >
                                Shop
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.2 }}>
                            <TableSortLabel
                                active={sortField === 'buy_price'}
                                direction={sortField === 'buy_price' ? sortOrder : 'asc'}
                                onClick={() => handleSort('buy_price')}
                            >
                                Buy Price
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.2 }}>
                            <TableSortLabel
                                active={sortField === 'average_price_items_sold'}
                                direction={sortField === 'average_price_items_sold' ? sortOrder : 'asc'}
                                onClick={() => handleSort('average_price_items_sold')}
                            >
                                Avg Sold
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.3 }}>
                            <TableSortLabel
                                active={sortField === 'sold_profit'}
                                direction={sortField === 'sold_profit' ? sortOrder : 'asc'}
                                onClick={() => handleSort('sold_profit')}
                            >
                                Sold Profit
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.3 }}>
                            <TableSortLabel
                                active={sortField === 'sales_24h_current'}
                                direction={sortField === 'sales_24h_current' ? sortOrder : 'asc'}
                                onClick={() => handleSort('sales_24h_current')}
                            >
                                24h Sales
                            </TableSortLabel>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.5 }}>
                            <Typography variant="body2">Sellout Duration</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 1.5 }}>
                            <Typography variant="body2">Next Restock</Typography>
                        </Grid>
                    </Grid>
                )}

                {/* Data Rows */}
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                    {sortedData.map((item: CountryItem) => (
                        (selectedCountry === 'Foreign' || (selectedCountry !== 'Torn' && selectedCountry !== 'Unknown')) ? (
                            // Foreign stock row
                            <Grid
                                container
                                spacing={2}
                                key={item.id}
                                sx={{
                                    py: 1.5,
                                    borderBottom: '1px solid #333',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                            >
                                <Grid size={{ xs: 12, sm: 2.5 }}>
                                    <Typography variant="body2">{item.name}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 1.5 }}>
                                    <Typography variant="body2">{item.country || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.2 }}>
                                    <Typography variant="body2">{formatCurrency(item.buy_price)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.2 }}>
                                    <Typography variant="body2">{formatCurrency(item.average_price_items_sold)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.3 }}>
                                    <Typography variant="body2" sx={{ color: (item.sold_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                        {formatCurrency(item.sold_profit)}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.3 }}>
                                    <Typography variant="body2">{formatDuration(item.travel_time_minutes)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.5 }}>
                                    <Typography variant="body2" sx={{ color: (item.profit_per_minute ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                        {formatCurrency(item.profit_per_minute)}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.5 }}>
                                    <Typography variant="body2">{formatNumber(item.sales_24h_current)}</Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            // Torn stock row
                            <Grid
                                container
                                spacing={2}
                                key={item.id}
                                sx={{
                                    py: 1.5,
                                    borderBottom: '1px solid #333',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                            >
                                <Grid size={{ xs: 12, sm: 2.5 }}>
                                    {item.shop_url_name ? (
                                        <Link 
                                            href={buildTornShopUrl(item) || undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ 
                                                textDecoration: 'none',
                                                color: 'primary.main',
                                                '&:hover': {
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            <Typography variant="body2">{item.name}</Typography>
                                        </Link>
                                    ) : (
                                        <Typography variant="body2">{item.name}</Typography>
                                    )}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 1.5 }}>
                                    <Typography variant="body2">{item.shop_name || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.2 }}>
                                    <Typography variant="body2">{formatCurrency(item.buy_price)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.2 }}>
                                    <Typography variant="body2">{formatCurrency(item.average_price_items_sold)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.3 }}>
                                    <Typography variant="body2" sx={{ color: (item.sold_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                        {formatCurrency(item.sold_profit)}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.3 }}>
                                    <Typography variant="body2">{formatNumber(item.sales_24h_current)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.5 }}>
                                    <Typography variant="body2">{formatDuration(item.sellout_duration_minutes)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 1.5 }}>
                                    <Typography variant="body2">{formatDateTime(item.next_estimated_restock_time)}</Typography>
                                </Grid>
                            </Grid>
                        )
                    ))}
                    {sortedData.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No data available for {selectedCountry}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
