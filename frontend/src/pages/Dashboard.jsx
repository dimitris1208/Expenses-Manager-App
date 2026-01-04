import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Card, CardContent, 
    Grid, Dialog, DialogTitle, DialogContent, TextField, DialogActions, 
    Chip, Tabs, Tab, AppBar, Toolbar, IconButton, useTheme, useMediaQuery,
    List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; 
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0); 
    
    // Data States
    const [balance, setBalance] = useState(0);
    const [settlements, setSettlements] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [history, setHistory] = useState([]); 

    // Modal States
    const [openExpense, setOpenExpense] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');

    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const userName = localStorage.getItem('user_name') || 'User';

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    };

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const resDash = await api.get('/dashboard');
            setBalance(resDash.data.my_balance);
            setSettlements(resDash.data.suggested_payments);
            
            const filter = tabValue === 1 ? 'mine' : 'all';
            const resExp = await api.get(`/expenses?filter=${filter}`);
            setExpenses(resExp.data);
            
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/settlements/history');
            setHistory(res.data);
            setOpenHistory(true);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchDashboard(); }, [tabValue]);

    const handleAddExpense = async () => {
        if (!formDesc || !formAmount) return;
        await api.post('/expenses', { description: formDesc, amount: formAmount });
        closeModals();
        fetchDashboard();
    };

    const handleSettle = async (receiverId, amount) => {
        if(!confirm(`Confirm payment of €${amount}?`)) return;
        await api.post('/settlements', { receiver_id: receiverId, amount: amount });
        fetchDashboard();
    };

    const closeModals = () => {
        setOpenExpense(false);
        setOpenHistory(false);
        setFormDesc('');
        setFormAmount('');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <Box sx={{ 
            flexGrow: 1, 
            bgcolor: '#F3F4F6', 
            minHeight: '100vh', 
            width: '100vw',        // Force full viewport width
            maxWidth: '100%',      
            overflowX: 'hidden',   // Prevent horizontal scroll
            display: 'flex', 
            flexDirection: 'column' 
        }}>
            
            {/* Header */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                {/* We constrain the toolbar content to match the dashboard width */}
                <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
                    <Toolbar>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <Box sx={{ bgcolor: '#4f46e5', width: 32, height: 32, borderRadius: 1, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                $
                            </Box>
                            <Typography variant="h6" component="div" sx={{ fontWeight: '700', letterSpacing: '-0.5px' }}>
                                STARTUP<span style={{ color: '#4f46e5' }}>FINANCE</span>
                            </Typography>
                        </Box>
                        <Tooltip title="Refresh Data">
                            <IconButton onClick={fetchDashboard} sx={{ mr: 1, bgcolor: '#f3f4f6' }}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Logout">
                            <IconButton color="error" onClick={handleLogout} sx={{ bgcolor: '#fee2e2' }}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </Box>
            </AppBar>

            {/* MAIN CONTENT WRAPPER */}
            <Box sx={{ 
                p: { xs: 2, md: 4 }, 
                width: '100%', 
                maxWidth: '1600px', // COMPACT FIX: Limits width on ultra-wide screens
                mx: 'auto',         // Centers the content
                boxSizing: 'border-box' 
            }}>
                
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="800" color="#111827">Dashboard</Typography>
                    <Typography variant="body1" color="textSecondary">Welcome back, {userName}.</Typography>
                </Box>

                <Grid container spacing={3}>
                    
                    {/* LEFT COLUMN */}
                    {/* MUI v7 Syntax: size={{ ... }} instead of xs={...} */}
                    <Grid size={{ xs: 12, lg: 3, xl: 3 }}> 
                        <Box display="flex" flexDirection="column" gap={3}>
                            
                            {/* Balance Card */}
                            <Card elevation={0} sx={{ 
                                background: balance >= 0 
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                    : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
                                color: 'white',
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <AccountBalanceWalletIcon sx={{ mr: 1, opacity: 0.8 }} />
                                        <Typography variant="overline" fontWeight="600" sx={{ opacity: 0.9 }}>NET BALANCE</Typography>
                                    </Box>
                                    <Typography variant="h4" fontWeight="800" sx={{ mb: 1 }}>
                                        {balance >= 0 ? '+' : '-'}€{Math.abs(balance).toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        {balance >= 0 ? "You are owed money." : "You owe the team."}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* Settlements */}
                            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e5e7eb' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" fontWeight="700" color="#374151" fontSize="1rem">
                                            Settlements
                                        </Typography>
                                        <Button 
                                            size="small" variant="text" startIcon={<HistoryIcon />} 
                                            onClick={fetchHistory} sx={{ color: '#6b7280', minWidth: 0, px: 1 }}
                                        >
                                            History
                                        </Button>
                                    </Box>
                                    
                                    {settlements.length === 0 ? (
                                        <Box sx={{ bgcolor: '#f0fdf4', p: 2, borderRadius: 2, border: '1px dashed #86efac', textAlign: 'center' }}>
                                            <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 32, mb: 1 }} />
                                            <Typography variant="body2" fontWeight="bold" color="#166534">All clear!</Typography>
                                        </Box>
                                    ) : (
                                        <List disablePadding>
                                            {settlements.map((s, i) => (
                                                <Paper key={i} elevation={0} sx={{ p: 1.5, mb: 1.5, bgcolor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 2 }}>
                                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                        <Typography variant="caption" fontWeight="bold">{s.from}</Typography>
                                                        <ArrowForwardIcon sx={{ color: '#9ca3af', fontSize: 14 }} />
                                                        <Typography variant="caption" fontWeight="bold">{s.to}</Typography>
                                                    </Box>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="subtitle1" fontWeight="800" color="#1f2937">€{s.amount}</Typography>
                                                        {s.payer_id === currentUserId && (
                                                            <Button size="small" variant="contained" color="success" onClick={() => handleSettle(s.receiver_id, s.amount)} sx={{ py: 0.5, fontSize: '0.7rem' }}>
                                                                Pay
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Paper>
                                            ))}
                                        </List>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    </Grid>

                    {/* RIGHT CONTENT */}
                    <Grid size={{ xs: 12, lg: 9, xl: 9 }}>
                        <Paper elevation={0} sx={{ width: '100%', borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden', height: '100%', minHeight: '500px' }}>
                            <Box sx={{ borderBottom: '1px solid #e5e7eb', bgcolor: 'white', px: 3, pt: 2 }}>
                                <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} indicatorColor="primary" textColor="primary">
                                    <Tab label="All Expenses" sx={{ fontWeight: 'bold' }} />
                                    <Tab label="My Expenses" sx={{ fontWeight: 'bold' }} />
                                </Tabs>
                            </Box>

                            <TableContainer>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 'bold', width: '40%' }}>DESCRIPTION</TableCell>
                                            <TableCell align="right" sx={{ bgcolor: '#f9fafb', fontWeight: 'bold' }}>AMOUNT</TableCell>
                                            {!isMobile && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 'bold' }}>PAYER</TableCell>}
                                            {!isMobile && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 'bold' }}>DATE</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                                    <Typography color="textSecondary">No expenses found.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            expenses.map((row) => (
                                                <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid #f3f4f6' } }}>
                                                    <TableCell>
                                                        <Typography fontWeight="500">{row.description}</Typography>
                                                        {isMobile && <Typography variant="caption" color="textSecondary">{row.payer}</Typography>}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip label={`€${row.amount.toFixed(2)}`} size="small" sx={{ fontWeight: 'bold', bgcolor: '#e0e7ff', color: '#3730a3' }} />
                                                    </TableCell>
                                                    {!isMobile && (
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: row.is_mine ? '#4f46e5' : '#9ca3af' }}>
                                                                    {getInitials(row.payer)}
                                                                </Avatar>
                                                                <Typography variant="body2">{row.payer}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                    )}
                                                    {!isMobile && <TableCell sx={{ color: '#6b7280' }}>{row.date}</TableCell>}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Floating Add Button */}
                <Tooltip title="Add New Expense">
                    <Button 
                        variant="contained" size="large" 
                        sx={{ 
                            position: 'fixed', bottom: 40, right: 40, 
                            borderRadius: '12px', px: 4, py: 1.5, 
                            bgcolor: '#1f2937', color: 'white',
                            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: '#111827' }
                        }}
                        startIcon={<AddIcon />}
                        onClick={() => setOpenExpense(true)}
                    >
                        Add Expense
                    </Button>
                </Tooltip>

                {/* MODALS */}
                <Dialog open={openExpense} onClose={closeModals} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 'bold' }}>New Expense</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus margin="dense" label="Description" fullWidth variant="outlined" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} sx={{ mb: 2, mt: 1 }} />
                        <TextField margin="dense" label="Amount (€)" type="number" fullWidth variant="outlined" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={closeModals} color="inherit">Cancel</Button>
                        <Button onClick={handleAddExpense} variant="contained" disabled={!formAmount || !formDesc}>Save</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openHistory} onClose={closeModals} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 'bold' }}>Payment History</DialogTitle>
                    <DialogContent dividers>
                        <List>
                            {history.map((h, i) => (
                                <ListItem key={i}>
                                    <ListItemText primary={`${h.payer} paid ${h.receiver}`} secondary={h.date} />
                                    <Typography fontWeight="bold" color="success.main">€{h.amount}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                    <DialogActions><Button onClick={closeModals}>Close</Button></DialogActions>
                </Dialog>

            </Box>
        </Box>
    );
}