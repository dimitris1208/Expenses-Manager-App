import React, { useState } from 'react';
import { 
    TextField, Button, Box, Typography, Paper, Alert, 
    CircularProgress, Grid, useTheme, useMediaQuery 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user_name', response.data.full_name);
            localStorage.setItem('user_id', response.data.user_id);
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            setLoading(false);
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else if (err.code === "ERR_NETWORK") {
                setError('Server is sleeping (Network Error). Please try again in 10 seconds.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    };

    return (
        <Grid 
            container 
            component="main" 
            sx={{ 
                height: '100vh', 
                width: '100vw',        // Force viewport width
                maxWidth: '100%',      // Double safety
                overflow: 'hidden',    // Kill scrollbars
                m: 0, 
                p: 0 
            }}
        >
            {/* Left Side - Brand Visual */}
            <Grid
                size={{ xs: false, sm: 4, md: 7, lg: 8 }} // MUI v7 Syntax
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    p: 4
                }}
            >
                <Box textAlign="center" maxWidth="600px">
                    <Typography variant="h2" fontWeight="800" letterSpacing={-1} mb={2}>
                        Startup Finance
                    </Typography>
                    <Typography variant="h5" fontWeight="300" sx={{ opacity: 0.8 }}>
                        The operating system for your team's expenses.
                    </Typography>
                </Box>
            </Grid>

            {/* Right Side - Login Form */}
            <Grid 
                size={{ xs: 12, sm: 8, md: 5, lg: 4 }} // MUI v7 Syntax
                component={Paper} 
                elevation={0} 
                square 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'white',
                    height: '100%' // Ensure it fills height
                }}
            >
                <Box sx={{ 
                    my: 8, 
                    mx: 6, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    width: '100%', 
                    maxWidth: '450px' // Keep form compact
                }}>
                    
                    {isMobile && (
                        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                            Startup Finance
                        </Typography>
                    )}

                    <Box sx={{ width: '100%', mb: 4 }}>
                        <Typography component="h1" variant="h4" fontWeight="bold" color="#111827" gutterBottom>
                            Sign in
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Welcome back! Please enter your details.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            sx={{ mb: 2 }}
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            sx={{ mb: 4 }}
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />
                        
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                textTransform: 'none',
                                bgcolor: '#312e81',
                                '&:hover': { bgcolor: '#1e1b4b' },
                                boxShadow: 'none'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}