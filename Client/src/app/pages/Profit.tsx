import { Box, Typography, CircularProgress, Alert, Tabs, Tab, Paper, Grid, TableSortLabel, Link, Card, CardContent, Collapse } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { useProfit } from '../../lib/hooks/useProfit';
import type { CountryItem } from '../../lib/types/profit';

type SortField = 'name' | 'shop_name' | 'country' | 'buy_price' | 'average_price_items_sold' | 'sold_profit' | 'sales_24h_current' | 'profit_per_minute' | 'travel_time_minutes';
type SortOrder = 'asc' | 'desc';

export default function Profit() {
    const { profitData, profitLoading, profitError } = useProfit();
    const [selectedCountry, setSelectedCountry] = useState<string>('Torn');
    const [sortField, setSortField] = useState<SortField>('sold_profit');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
    
    // Auto-refresh countdown every second
    const [, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const countries = useMemo(() => {
        if (!profitData?.results) return [];
        return Object.keys(profitData.results).sort((a, b) => {
            // Torn first
            if (a === 'Torn') return -1;
            if (b === 'Torn') return 1;
            // Then alphabetical
            return a.localeCompare(b);
        });
    }, [profitData]);

    // Group all foreign countries (non-Torn) for the "Foreign" tab - memoize to prevent hook count changes
    const foreignCountries = useMemo(() => {
        return countries.filter(c => c !== 'Torn');
    }, [countries]);
    
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
    
    // Get unique foreign countries with travel times for the bottom section
    const foreignCountriesWithTravelTimes = useMemo(() => {
        if (!profitData?.results) return [];
        
        const countriesMap = new Map<string, { code: string; name: string; travelTime: number }>();
        
        foreignCountries.forEach(countryName => {
            const items = profitData.results[countryName];
            if (items && items.length > 0) {
                const firstItem = items[0];
                if (firstItem.country_code && firstItem.travel_time_minutes) {
                    countriesMap.set(countryName, {
                        code: firstItem.country_code,
                        name: countryName,
                        travelTime: firstItem.travel_time_minutes
                    });
                }
            }
        });
        
        return Array.from(countriesMap.values());
    }, [profitData, foreignCountries]);

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

        // Round to nearest whole minute (matches in-game display)
        const rounded = Math.round(minutes);

        if (rounded < 60) return `${rounded}m`;

        const hours = Math.floor(rounded / 60);
        const mins = rounded % 60;

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

    const buildTravelUrl = (countryCode: string) => {
        return `https://www.torn.com/page.php?sid=travel&destination=${countryCode}`;
    };

    // Calculate boarding time left (can be negative if missed)
    const calculateBoardingTimeLeft = (boardingTime: string | null | undefined): number | null => {
        if (!boardingTime) return null;
        const now = new Date();
        const boarding = new Date(boardingTime);
        return Math.floor((boarding.getTime() - now.getTime()) / 1000); // Return in seconds
    };

    // Format boarding time left as a countdown string
    const formatBoardingTimeLeft = (seconds: number | null): string => {
        if (seconds === null) return '-';
        
        const isNegative = seconds < 0;
        const absSeconds = Math.abs(seconds);
        
        const hours = Math.floor(absSeconds / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);
        const secs = absSeconds % 60;
        
        const prefix = isNegative ? '-' : '';
        
        if (hours > 0) {
            return `${prefix}${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${prefix}${minutes}m ${secs}s`;
        } else {
            return `${prefix}${secs}s`;
        }
    };

    // Calculate next boarding time for foreign shops (generic, not tied to a specific item)
    // NOTE: travelTimeMinutes from API is ONE-WAY time
    const calculateNextBoardingTime = (travelTimeMinutes: number): string => {
        const now = new Date();
        const travelTimeToDestination = travelTimeMinutes; // Already one-way
        
        // Calculate when we would land if we boarded right now
        const landingTimeIfBoardNow = new Date(now.getTime() + travelTimeToDestination * 60 * 1000);
        
        // Find the next 15-minute slot AFTER our landing time
        const nextSlot = roundUpToNextQuarterHour(landingTimeIfBoardNow);
        
        // Boarding time is the landing slot minus travel time
        const boardingTime = new Date(nextSlot.getTime() - travelTimeToDestination * 60 * 1000);
        return boardingTime.toISOString();
    };

    // Calculate boarding time for a specific item based on its next restock time
    // This ensures boarding times are always fresh and in the future
    const calculateItemBoardingTime = (item: CountryItem): string | null => {
        if (!item.travel_time_minutes || item.travel_time_minutes <= 0) return null;
        
        const now = new Date();
        const travelTimeToDestination = item.travel_time_minutes; // ONE-WAY time
        
        // Calculate when we would land if we boarded right now
        const landingTimeIfBoardNow = new Date(now.getTime() + travelTimeToDestination * 60 * 1000);
        
        let targetRestockTime: Date;
        
        if (item.next_estimated_restock_time) {
            // We have restock data - find next restock after our landing time
            let estimatedRestock = new Date(item.next_estimated_restock_time);
            
            // If the estimated restock is before we would land, advance to next cycle(s)
            while (estimatedRestock <= landingTimeIfBoardNow) {
                // Advance by 15 minutes (one restock cycle)
                estimatedRestock = new Date(estimatedRestock.getTime() + 15 * 60 * 1000);
            }
            
            targetRestockTime = estimatedRestock;
        } else {
            // No restock data - find next quarter hour after landing time
            targetRestockTime = roundUpToNextQuarterHour(landingTimeIfBoardNow);
        }
        
        // Boarding time is the target restock time minus the travel time
        const boardingTimeDate = new Date(targetRestockTime.getTime() - travelTimeToDestination * 60 * 1000);
        return boardingTimeDate.toISOString();
    };

    // Helper function to round up to next quarter hour (client-side version)
    const roundUpToNextQuarterHour = (date: Date): Date => {
        const result = new Date(date);
        const minutes = result.getMinutes();
        const seconds = result.getSeconds();
        const milliseconds = result.getMilliseconds();
        
        const minutesToAdd = 15 - (minutes % 15);
        
        if (minutesToAdd === 15 && seconds === 0 && milliseconds === 0) {
            return result;
        }
        
        result.setMinutes(minutes + minutesToAdd);
        result.setSeconds(0);
        result.setMilliseconds(0);
        
        return result;
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
                        <Box key={item.id}>
                            {(selectedCountry === 'Foreign' || (selectedCountry !== 'Torn' && selectedCountry !== 'Unknown')) ? (
                                // Foreign stock row
                                <>
                                    <Grid
                                        container
                                        spacing={2}
                                        sx={{
                                            py: 1.5,
                                            borderBottom: '1px solid #333',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                cursor: 'pointer'
                                            }
                                        }}
                                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
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
                                    <Collapse in={expandedItemId === item.id}>
                                        <Card sx={{ m: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    {item.name} - Details
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Country:</Typography>
                                                        <Typography variant="body1">{item.country || '-'}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Buy Price:</Typography>
                                                        <Typography variant="body1">{formatCurrency(item.buy_price)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Market Price:</Typography>
                                                        <Typography variant="body1">{formatCurrency(item.market_price)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Profit Per 1:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.profitPer1 ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.profitPer1)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Avg Sold Price:</Typography>
                                                        <Typography variant="body1">{formatCurrency(item.average_price_items_sold)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Estimated Market Value Profit:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.estimated_market_value_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.estimated_market_value_profit)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Lowest 50 Profit:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.lowest_50_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.lowest_50_profit)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Sold Profit:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.sold_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.sold_profit)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">In Stock:</Typography>
                                                        <Typography variant="body1">{formatNumber(item.in_stock)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">24h Sales Current:</Typography>
                                                        <Typography variant="body1">{formatNumber(item.sales_24h_current)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">24h Sales Previous:</Typography>
                                                        <Typography variant="body1">{formatNumber(item.sales_24h_previous)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">24h Trend:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.trend_24h ?? 0) > 0 ? '#4caf50' : (item.trend_24h ?? 0) < 0 ? '#f44336' : 'inherit' }}>
                                                            {item.trend_24h !== null && item.trend_24h !== undefined ? `${item.trend_24h > 0 ? '+' : ''}${formatNumber(item.trend_24h)}` : '-'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Hour Velocity 24:</Typography>
                                                        <Typography variant="body1">{item.hour_velocity_24 !== null && item.hour_velocity_24 !== undefined ? item.hour_velocity_24.toFixed(2) : '-'}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Travel Time:</Typography>
                                                        <Typography variant="body1">{formatDuration(item.travel_time_minutes)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Profit/Min:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.profit_per_minute ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.profit_per_minute)}
                                                        </Typography>
                                                    </Grid>
                                                    {item.travel_time_minutes && item.travel_time_minutes > 0 && (
                                                        <>
                                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                                <Typography variant="body2" color="text.secondary">Boarding Time:</Typography>
                                                                <Typography variant="body1">{formatDateTime(calculateItemBoardingTime(item))}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                                <Typography variant="body2" color="text.secondary">Boarding Time Left:</Typography>
                                                                <Link
                                                                    href={item.country_code ? buildTravelUrl(item.country_code) : undefined}
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
                                                                    <Typography variant="body1">
                                                                        {formatBoardingTimeLeft(calculateBoardingTimeLeft(calculateItemBoardingTime(item)))}
                                                                    </Typography>
                                                                </Link>
                                                            </Grid>
                                                        </>
                                                    )}
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Collapse>
                                </>
                            ) : (
                                // Torn stock row
                                <>
                                    <Grid
                                        container
                                        spacing={2}
                                        sx={{
                                            py: 1.5,
                                            borderBottom: '1px solid #333',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                cursor: 'pointer'
                                            }
                                        }}
                                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
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
                                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                                    <Collapse in={expandedItemId === item.id}>
                                        <Card sx={{ m: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    {item.name} - Details
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Shop:</Typography>
                                                        <Typography variant="body1">{item.shop_name || '-'}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Buy Price:</Typography>
                                                        <Typography variant="body1">{formatCurrency(item.buy_price)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Market Price:</Typography>
                                                        <Typography variant="body1">{formatCurrency(item.market_price)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Profit Per 1:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.profitPer1 ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.profitPer1)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Avg Sold Price:</Typography>
                                                        <Typography variant="body1">{formatCurrency(item.average_price_items_sold)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Estimated Market Value Profit:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.estimated_market_value_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.estimated_market_value_profit)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Lowest 50 Profit:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.lowest_50_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.lowest_50_profit)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Sold Profit:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.sold_profit ?? 0) > 0 ? '#4caf50' : 'inherit' }}>
                                                            {formatCurrency(item.sold_profit)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">In Stock:</Typography>
                                                        <Typography variant="body1">{formatNumber(item.in_stock)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">24h Sales Current:</Typography>
                                                        <Typography variant="body1">{formatNumber(item.sales_24h_current)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">24h Sales Previous:</Typography>
                                                        <Typography variant="body1">{formatNumber(item.sales_24h_previous)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">24h Trend:</Typography>
                                                        <Typography variant="body1" sx={{ color: (item.trend_24h ?? 0) > 0 ? '#4caf50' : (item.trend_24h ?? 0) < 0 ? '#f44336' : 'inherit' }}>
                                                            {item.trend_24h !== null && item.trend_24h !== undefined ? `${item.trend_24h > 0 ? '+' : ''}${formatNumber(item.trend_24h)}` : '-'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Hour Velocity 24:</Typography>
                                                        <Typography variant="body1">{item.hour_velocity_24 !== null && item.hour_velocity_24 !== undefined ? item.hour_velocity_24.toFixed(2) : '-'}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Sellout Duration:</Typography>
                                                        <Typography variant="body1">{formatDuration(item.sellout_duration_minutes)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Cycles Skipped:</Typography>
                                                        <Typography variant="body1">{item.cycles_skipped !== null && item.cycles_skipped !== undefined ? formatNumber(item.cycles_skipped) : '-'}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Last Restock:</Typography>
                                                        <Typography variant="body1">{formatDateTime(item.last_restock_time)}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">Next Restock:</Typography>
                                                        <Typography variant="body1">{formatDateTime(item.next_estimated_restock_time)}</Typography>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Collapse>
                                </>
                            )}
                        </Box>
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

            {/* Boarding Time Section for Foreign Shops */}
            {(selectedCountry === 'Foreign' || (selectedCountry !== 'Torn' && selectedCountry !== 'Unknown')) && foreignCountriesWithTravelTimes.length > 0 && (
                <Paper sx={{ mt: 3, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Boarding Times for Foreign Shops
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Board at these times to land exactly on a 15-minute restock slot
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        {foreignCountriesWithTravelTimes.map((country) => {
                            // For country-level, calculate generic boarding time to land on next 15-min slot
                            const boardingTime = calculateNextBoardingTime(country.travelTime);
                            const timeLeft = calculateBoardingTimeLeft(boardingTime);
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={country.code}>
                                    <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {country.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Travel Time (one-way):
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {formatDuration(country.travelTime)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Boarding Time:
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {formatDateTime(boardingTime)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Time Left:
                                            </Typography>
                                            <Link
                                                href={buildTravelUrl(country.code)}
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
                                                <Typography variant="h6" sx={{ color: timeLeft && timeLeft < 0 ? '#f44336' : '#4caf50' }}>
                                                    {formatBoardingTimeLeft(timeLeft)}
                                                </Typography>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            )}
        </Box>
    );
}
