'use client';

import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-section">
          <h3>YourCompany</h3>
          <p>Empowering your digital journey with modern solutions.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links </h4>
          <ul>
            <li><a href="/signin">Sign In as Patient</a></li>
            <li><a href="/signin-doctor">Sign In as Doctor</a></li>
            <li><a href="/signup">Sign Up as Patient</a></li>
            <li><a href="/signup-doctor">Sign Up as Doctor</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Subscribe</h4>
          <form className="newsletter-form">
            <input type="email" placeholder="Your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} YourCompany. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
