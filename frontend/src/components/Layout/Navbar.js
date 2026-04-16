import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, ShoppingBag, BookOpen, User, LayoutDashboard, Package, Compass, Car, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const path = location.pathname;

  const isVendor   = user?.role === 'vendor';
  const isProvider = user?.role === 'provider';

  const travelerTabs = [
    { to: '/',            icon: Map,           label: 'Explore',   active: path === '/' },
    { to: '/waves',       icon: Car,           label: 'Waves',     active: path.startsWith('/wave') },
    { to: '/marketplace', icon: ShoppingBag,   label: 'Shop',      active: path === '/marketplace' },
    { to: '/packages',    icon: Compass,       label: 'Trips',     active: path === '/packages' },
    { to: '/journal',     icon: BookOpen,      label: 'Journal',   active: path === '/journal' },
    { to: '/profile',     icon: User,          label: 'Me',        active: path === '/profile' },
  ];

  const vendorTabs = [
    { to: '/vendor/dashboard',  icon: LayoutDashboard, label: 'Dashboard', active: path === '/vendor/dashboard' },
    { to: '/vendor/listings',   icon: Package,         label: 'Listings',  active: path.startsWith('/vendor/listings') },
    { to: '/marketplace',       icon: ShoppingBag,     label: 'Shop',      active: path === '/marketplace' },
    { to: '/profile',           icon: User,            label: 'Settings',  active: path === '/profile' },
  ];

  const providerTabs = [
    { to: '/provider/dashboard', icon: LayoutDashboard, label: 'Panel',   active: path === '/provider/dashboard' },
    { to: '/provider/packages',  icon: Package,         label: 'Host',    active: path.startsWith('/provider/packages') },
    { to: '/packages',           icon: Compass,         label: 'Browse',  active: path === '/packages' },
    { to: '/profile',            icon: User,            label: 'Profile', active: path === '/profile' },
  ];

  const tabs = isProvider ? providerTabs : isVendor ? vendorTabs : travelerTabs;

  return (
    <>
      {/* ── Desktop Floating Top Nav ── */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0,    opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="nav-desktop"
      >
        <div className="nav-container">

          {/* Brand */}
          <Link to="/" className="nav-brand">
            <motion.div
              className="brand-icon"
              whileHover={{ rotate: 15, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Compass size={22} />
            </motion.div>
            <span className="brand-name">Wander<span>Mates</span></span>
          </Link>

          {/* Links */}
          <div className="nav-links">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`nav-link ${tab.active ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Account */}
          <div className="nav-account">
            <Link to="/profile" className="user-profile-mini">
              <div className="avatar-small">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
              <div className="user-text">
                <span className="user-name">{user?.full_name?.split(' ')[0]}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </Link>
            <motion.button
              className="logout-btn"
              onClick={onLogout}
              title="Sign Out"
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut size={16} />
            </motion.button>
          </div>

        </div>
      </motion.nav>

      {/* ── Mobile Floating Bottom Nav ── */}
      <nav className="nav-mobile">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`mobile-nav-item ${tab.active ? 'active' : ''}`}
            >
              <motion.div
                className="icon-wrapper"
                whileTap={{ scale: 0.75 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Icon size={20} strokeWidth={tab.active ? 2.5 : 1.8} />
              </motion.div>
              <span className="mobile-nav-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Navbar;
