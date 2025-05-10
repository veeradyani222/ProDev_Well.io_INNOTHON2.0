'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './../assets/wellio-logo.svg';
import Menu from './../assets/Menubtn.svg';
import Remove from './../assets/remove.svg';
import { usePathname } from 'next/navigation';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.user) {
          setUserRole(decoded.user.appUser);
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    };

    fetchUserRole();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUserRole('');
    router.push('/');
  };

  const handleDashboardRedirect = () => {
    if (userRole === 'Patient') {
      router.push('/PatientDashboard');
    } else if (userRole === 'Doctor') {
      router.push('/DoctorDashboard');
    }
  };

  if (!isClient) return null;

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <Link href='/'>
          <Image src={Logo} alt='Logo' className='logo-nav' />
        </Link>
      </div>

      {/* Desktop Navigation - Only show if not logged in as patient */}
      {!userRole && (
        <div className='navbar-center desktop-only'>
          <Link href='/' className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link href='/contact' className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Contact Us</Link>
        </div>
      )}

      <div className='navbar-right'>
        {/* Desktop Auth Section */}
        <div className='auth-buttons desktop-only'>
          {userRole ? (
            <>
              <button onClick={handleDashboardRedirect} className="sign-up-btn">Dashboard</button>
              <button onClick={handleSignOut} className="sign-in-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link href='/signin-doctor' className='sign-in-btn'>Login As Doctor</Link>
              <Link href='/signin' className='sign-up-btn'>Login As Patient</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className='hamburger-btn mobile-only'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Image className='menu-icon' src={isMenuOpen ? Remove : Menu} alt='menu' />
        </button>
      </div>

      {/* Mobile Navigation Menu - Only show Home/Contact if not logged in */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        {!userRole && (
          <>
            <Link href='/' className={`mobile-nav-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link href='/contact' className={`mobile-nav-link ${pathname === '/contact' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Contact Us</Link>
          </>
        )}

        <div className='mobile-auth-buttons'>
          {userRole ? (
            <>
              <button onClick={handleSignOut} className="mobile-sign-in-btn">Sign Out</button>
              <button onClick={handleDashboardRedirect} className="mobile-sign-up-btn">Dashboard</button>
            </>
          ) : (
            <>
              <Link href='/signin-doctor' className='mobile-sign-in-btn' onClick={() => setIsMenuOpen(false)}>Login As Doctor</Link>
              <Link href='/signin' className='mobile-sign-up-btn' onClick={() => setIsMenuOpen(false)}>Login As Patient</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;