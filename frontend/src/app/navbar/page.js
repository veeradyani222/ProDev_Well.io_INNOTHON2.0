'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './../assets/wellio-logo.svg';
import Menu from './../assets/Menubtn.svg';
import Remove from './../assets/remove.svg';
import { usePathname } from 'next/navigation';
import jwt_decode from 'jwt-decode';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const pathname = usePathname();
  const buttonRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const decoded = jwt_decode(token);
        const userInfo = decoded?.user || decoded?.doctor;
        const email = userInfo?.email;
        const appUser = userInfo?.appUser;

        if (!email || !appUser) return;

        localStorage.setItem("userEmail", email);

        const response = await fetch('https://doord.onrender.com/allusers');
        const users = await response.json();

        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
          setUserName(foundUser.name);
          localStorage.setItem("userName", foundUser.name);
        }
      } catch (err) {
        console.error('Failed to decode token or fetch user:', err);
      }
    };

    fetchUserName();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setUserName('');
    router.push("/");
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <Link href='/'>
          <Image src={Logo} alt='Logo' className='logo-nav' />
        </Link>
      </div>

      <div className='navbar-center desktop-only'>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`nav-link ${pathname === link.path ? 'active' : ''}`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className='navbar-right'>
        <div className='auth-buttons desktop-only'>
          {userName ? (
            <>
              <span className="hello-user">Hello, {userName}</span>
              <Link href='/dashboard' className="sign-in-btn">My Dashboard</Link>
              <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link href='/signin-doctor' className='sign-in-btn'>Login As Doctor</Link>
              <Link href='/signin' className='sign-up-btn'>Login As Patient</Link>
            </>
          )}
        </div>

        <button
          ref={buttonRef}
          className='hamburger-btn mobile-only'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Image
            className='menu-icon'
            src={isMenuOpen ? Remove : Menu}
            alt='menu'
          />
        </button>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`mobile-nav-link ${pathname === link.path ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            {link.name}
          </Link>
        ))}

        <div className='mobile-auth-buttons'>
          {userName ? (
            <>
              <span className="hello-user">Hello, {userName}!</span>
              <Link href='/dashboard' className="mobile-sign-up-btn" onClick={() => setIsMenuOpen(false)}>My Dashboard</Link>
              <button onClick={handleSignOut} className="mobile-sign-out-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link href='/signin-doctor' className='mobile-sign-up-btn' onClick={() => setIsMenuOpen(false)}>Login As Doctor</Link>
              <Link href='/signin' className='mobile-sign-in-btn' onClick={() => setIsMenuOpen(false)}>Login As Patient</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
