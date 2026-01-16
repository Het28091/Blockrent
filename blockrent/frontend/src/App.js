import { ChakraProvider, Box } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import AuthGuard from './components/AuthGuard';
import Footer from './components/Footer';
import LoadingAnimation from './components/LoadingAnimation';
import Navbar from './components/Navbar';
import PiiConsentModal from './components/PiiConsentModal';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import AuthPage from './pages/AuthPage';
import ConnectWalletPage from './pages/ConnectWalletPage';
import CreateListing from './pages/CreateListing';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ListingsPage from './pages/ListingsPage';
import Marketplace from './pages/Marketplace';
import PurchasesPage from './pages/PurchasesPage';
import SettingsPage from './pages/SettingsPage';
import theme from './theme';

const MotionBox = motion(Box);

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Clear all auth data on app load (fresh start every time)
  useEffect(() => {
    // Clear authentication data
    // localStorage.removeItem('sessionId');
    // localStorage.removeItem('walletAddress');

    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      setTimeout(() => setLoading(false), 0);
    } else {
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const handleAnimationComplete = () => {
    setLoading(false);
  };

  if (loading) {
    return <LoadingAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <ChakraProvider theme={theme}>
      <Web3Provider>
        <AuthProvider>
          <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <PiiConsentModal />
            <Box as="main" flex="1" pt="80px">
              <AnimatePresence mode="wait">
                <MotionBox
                  key={location.pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Routes location={location}>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/signin" element={<AuthPage />} />
                    <Route path="/signup" element={<AuthPage />} />

                    {/* Marketplace - Protected */}
                    <Route
                      path="/marketplace"
                      element={
                        <AuthGuard requireAuth={true}>
                          <Marketplace />
                        </AuthGuard>
                      }
                    />

                    {/* Auth Required Routes */}
                    <Route
                      path="/connect-wallet"
                      element={
                        <AuthGuard requireAuth={true}>
                          <ConnectWalletPage />
                        </AuthGuard>
                      }
                    />

                    {/* Protected Routes (Auth + Wallet Required) */}
                    <Route
                      path="/dashboard"
                      element={
                        <AuthGuard requireAuth={true} requireWallet={true}>
                          <Dashboard />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/create"
                      element={
                        <AuthGuard requireAuth={true} requireWallet={true}>
                          <CreateListing />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/purchases"
                      element={
                        <AuthGuard requireAuth={true} requireWallet={true}>
                          <PurchasesPage />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/listings"
                      element={
                        <AuthGuard requireAuth={true} requireWallet={true}>
                          <ListingsPage />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <AuthGuard requireAuth={true} requireWallet={true}>
                          <SettingsPage />
                        </AuthGuard>
                      }
                    />
                  </Routes>
                </MotionBox>
              </AnimatePresence>
            </Box>
            <Footer />
          </Box>
        </AuthProvider>
      </Web3Provider>
    </ChakraProvider>
  );
}

const AppWrapper = () => (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </Router>
);

export default AppWrapper;
