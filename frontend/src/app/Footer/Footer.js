'use client';
import React from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-about">
          <div className="footer-logo">
            <span>Wellio</span>
          </div>
          <p>
            Your trusted partner in health and wellness. We provide innovative solutions
            to help you achieve your health goals and live a better life.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" className="social-link" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/about">About Us</a>
            </li>
            <li>
              <a href="/services">Services</a>
            </li>
            <li>
              <a href="/patient-dashboard">Patient Portal</a>
            </li>
            <li>
              <a href="/doctor-dashboard">Doctor Portal</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p>
            <FaMapMarkerAlt />
            123 Wellness Street, Health District
          </p>
          <p>
            <FaPhone />
            +1 (555) 123-4567
          </p>
          <p>
            <FaEnvelope />
            contact@wellio.com
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Wellio Health. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;