import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MapView from './components/Map/MapView';
import ActivityDetails from './components/Activities/ActivityDetails';
import CreateActivity from './components/Activities/CreateActivity';
import Profile from './components/Profile/Profile';
import TravelJournal from './components/Journal/TravelJournal';
import Marketplace from './components/Marketplace/Marketplace';
import VendorDashboard from './components/Vendor/VendorDashboard';
import VendorListings from './components/Vendor/VendorListings';
import TravelPackages from './components/Packages/TravelPackages';
import ProviderDashboard from './components/Provider/ProviderDashboard';
import WaveDashboard from './components/Waves/WaveDashboard';
import Navbar from './components/Layout/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Get user location on login
  useEffect(() => {
    if (user && !userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setUserLocation({ lat: 30.0869, lng: 78.2676 }),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [user]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserLocation(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading WanderMates...</p>
      </div>
    );
  }

  const isVendor = user?.role === 'vendor';
  const isProvider = user?.role === 'provider';
  const defaultRoute = isVendor ? '/vendor/dashboard' : isProvider ? '/provider/dashboard' : '/';

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={defaultRoute} />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register onLogin={handleLogin} /> : <Navigate to={defaultRoute} />} 
          />

          {/* Traveler routes */}
          <Route 
            path="/" 
            element={user ? <MapView user={user} onLocationChange={setUserLocation} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/activity/:id" 
            element={user ? <ActivityDetails user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-activity" 
            element={user ? <CreateActivity user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/journal" 
            element={user ? <TravelJournal user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/marketplace" 
            element={user ? <Marketplace user={user} userLocation={userLocation} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/packages" 
            element={user ? <TravelPackages user={user} userLocation={userLocation} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/waves" 
            element={user ? <WaveDashboard user={user} userLocation={userLocation} /> : <Navigate to="/login" />} 
          />

          {/* Vendor routes */}
          <Route 
            path="/vendor/dashboard" 
            element={user && isVendor ? <VendorDashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/vendor/listings" 
            element={user && isVendor ? <VendorListings user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/vendor/listings/new" 
            element={user && isVendor ? <VendorListings user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/vendor/listings/edit/:id" 
            element={user && isVendor ? <VendorListings user={user} /> : <Navigate to="/login" />} 
          />

          {/* Provider routes */}
          <Route 
            path="/provider/dashboard" 
            element={user && isProvider ? <ProviderDashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/provider/packages" 
            element={user && isProvider ? <ProviderDashboard user={user} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
