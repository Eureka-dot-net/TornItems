import { Box, Typography, CircularProgress, Alert, Tabs, Tab, Paper } from '@mui/material';
import { useState } from 'react';
import { useProfit } from '../../lib/hooks/useProfit';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

export default function Profit() {
    const { profitData, profitLoading, profitError } = useProfit();
    const [selectedCountry, setSelectedCountry] = useState<string>('Torn');

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

    const countries = Object.keys(profitData.results).sort();
    const currentData = profitData.results[selectedCountry] || [];

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Name', width: 200 },
        { 
            field: 'buy_price', 
            headerName: 'Buy Price', 
            width: 120,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
        { 
            field: 'market_price', 
            headerName: 'Market Price', 
            width: 130,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
        { 
            field: 'profitPer1', 
            headerName: 'Profit Per 1', 
            width: 130,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
        { field: 'shop_name', headerName: 'Shop', width: 200 },
        { 
            field: 'in_stock', 
            headerName: 'In Stock', 
            width: 100,
            type: 'number',
            valueFormatter: (value: number | null | undefined) => value !== null && value !== undefined ? value.toLocaleString() : '-'
        },
        { 
            field: 'sales_24h_current', 
            headerName: '24h Sales', 
            width: 110,
            type: 'number',
            valueFormatter: (value: number | null | undefined) => value !== null && value !== undefined ? value.toLocaleString() : '-'
        },
        { 
            field: 'hour_velocity_24', 
            headerName: 'Sales/Hour', 
            width: 120,
            type: 'number',
            valueFormatter: (value: number | null | undefined) => value !== null && value !== undefined ? value.toFixed(2) : '-'
        },
        { 
            field: 'average_price_items_sold', 
            headerName: 'Avg Sold Price', 
            width: 140,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
        { 
            field: 'estimated_market_value_profit', 
            headerName: 'Est. Profit', 
            width: 130,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
        { 
            field: 'lowest_50_profit', 
            headerName: 'Low 50 Profit', 
            width: 140,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
        { 
            field: 'sold_profit', 
            headerName: 'Sold Profit', 
            width: 130,
            type: 'number',
            valueFormatter: (value: number | null) => value ? `$${value.toLocaleString()}` : '-'
        },
    ];

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        setSelectedCountry(newValue);
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
                    {countries.map((country) => (
                        <Tab 
                            key={country} 
                            label={`${country} (${profitData.results[country].length})`} 
                            value={country} 
                        />
                    ))}
                </Tabs>
            </Paper>

            <Box sx={{ mt: 3, height: 600, width: '100%' }}>
                <DataGrid
                    rows={currentData}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 25, page: 0 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                />
            </Box>
        </Box>
    );
}
