import React from 'react';
// We import GlobalStyles to force the layout fix directly from React
import { GlobalStyles } from '@mui/material'; 
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Using HashRouter for GitHub Pages compatibility
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

// --- THE FIX IS HERE ---
// This injects styles into the browser that override index.css
const forceLayoutStyles = (
  <GlobalStyles styles={{
    'html, body': {
      margin: 0,
      padding: 0,
      width: '100% !important',
      height: '100% !important',
      display: 'block !important', /* Kills the 'flex' centering issue */
      maxWidth: '100vw !important',
      overflowX: 'hidden'
    },
    '#root': {
      width: '100% !important',
      height: '100% !important',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100% !important'
    }
  }} />
);

function App() {
  return (
    <Router>
      {/* Verify the fix is loaded */}
      {forceLayoutStyles}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
            <PrivateRoute>
                <Dashboard />
            </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;