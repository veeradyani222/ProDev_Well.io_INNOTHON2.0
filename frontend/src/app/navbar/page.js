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
        if (decoded && (decoded.user || decoded.doctor)) {
          setUserRole(decoded.user?.appUser || decoded.doctor?.appUser);
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
    setIsMenuOpen(false);
  };

  const handleDashboardRedirect = () => {
    if (userRole === 'Patient') {
      router.push('/PatientDashboard');
    } else if (userRole === 'Doctor') {
      router.push('/DoctorDashboard');
    }
    setIsMenuOpen(false);
  };

  if (!isClient) return null;

  const shouldHideNavLinks = userRole === 'Patient' || userRole === 'Doctor';

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <Link href='/'>
          <Image src={Logo} alt='Wellio Logo' className='logo-nav' priority />
        </Link>
      </div>

      {!shouldHideNavLinks && (
        <div className='navbar-center desktop-only'>
          <Link href='/' className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link href='/contact' className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>
            Contact Us
          </Link>
        </div>
      )}

      <div className='navbar-right'>
        <div className='auth-buttons desktop-only'>
          {userRole ? (
            <>
              <button
                onClick={handleDashboardRedirect}
                className="nav-button primary-button"
              >
                Dashboard
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="nav-button secondary-button"
              >
                Sign Out
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 17L21 12M21 12L16 7M21 12H9M9 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link href='/signin-doctor' className='nav-button secondary-button'>
                Doctor Login
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 21C19 17.134 15.866 14 12 14C8.13401 14 5 17.134 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href='/signin' className='nav-button primary-button'>
                Patient Login
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </>
          )}
        </div>

        <button
          className='hamburger-btn mobile-only'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <Image
            className='menu-icon'
            src={isMenuOpen ? Remove : Menu}
            alt={isMenuOpen ? 'Close menu' : 'Open menu'}
          />
        </button>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        {!shouldHideNavLinks && (
          <>
            <Link
              href='/'
              className={`mobile-nav-link ${pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href='/contact'
              className={`mobile-nav-link ${pathname === '/contact' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>
          </>
        )}

        <div className='mobile-auth-buttons'>
          {userRole ? (
            <>
              <button onClick={handleSignOut} className="nav-button secondary-button">
                Sign Out
              </button>
              <button onClick={handleDashboardRedirect} className="nav-button primary-button">
                Dashboard
              </button>
            </>
          ) : (
            <>
              <Link
                href='/signin-doctor'
                className='nav-button secondary-button'
                onClick={() => setIsMenuOpen(false)}
              >
                Doctor Login
              </Link>
              <Link
                href='/signin'
                className='nav-button primary-button'
                onClick={() => setIsMenuOpen(false)}
              >
                Patient Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;