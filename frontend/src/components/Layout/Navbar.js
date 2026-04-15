import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, ShoppingBag, BookOpen, User, LayoutDashboard, Package, Compass } from 'lucide-react';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const path = location.pathname;

  const isVendor = user?.role === 'vendor';
  const isProvider = user?.role === 'provider';

  const travelerTabs = [
    { to: '/', icon: Map, label: 'Map', active: path === '/' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace', active: path === '/marketplace' },
    { to: '/packages', icon: Compass, label: 'Packages', active: path === '/packages' },
    { to: '/journal', icon: BookOpen, label: 'Journal', active: path === '/journal' },
    { to: '/profile', icon: User, label: 'Me', active: path === '/profile' },
  ];

  const vendorTabs = [
    { to: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: path === '/vendor/dashboard' },
    { to: '/vendor/listings', icon: Package, label: 'Listings', active: path.startsWith('/vendor/listings') },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace', active: path === '/marketplace' },
    { to: '/profile', icon: User, label: 'Me', active: path === '/profile' },
  ];

  const providerTabs = [
    { to: '/provider/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: path === '/provider/dashboard' },
    { to: '/provider/packages', icon: Package, label: 'Packages', active: path.startsWith('/provider/packages') },
    { to: '/packages', icon: Compass, label: 'Browse', active: path === '/packages' },
    { to: '/profile', icon: User, label: 'Me', active: path === '/profile' },
  ];

  const tabs = isProvider ? providerTabs : isVendor ? vendorTabs : travelerTabs;

  return (
    <>
      {/* Desktop top nav */}
      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link to="/" className="top-nav-brand">
            <div className="brand-logo">
              <Compass size={22} strokeWidth={2.5} />
            </div>
            <span className="brand-text">WanderMates</span>
          </Link>
          <div className="top-nav-links">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`top-nav-link ${tab.active ? 'active' : ''}`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="top-nav-user">
            <span className="top-nav-avatar">
              {user?.full_name?.charAt(0) || '?'}
            </span>
            <button className="top-nav-logout" onClick={onLogout}>Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`bottom-nav-item ${tab.active ? 'active' : ''}`}
            >
              <Icon size={22} strokeWidth={tab.active ? 2.5 : 1.8} />
              <span className="bottom-nav-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Navbar;
