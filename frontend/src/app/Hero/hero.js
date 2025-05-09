'use client';
import './hero.css';
import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Hero() {
 return (
  <div className="hero-container">
   <div className="hero-content">
    <div className="hero-text">
     <h1 className="hero-title">Smarter Patient Monitoring. Safer Lives.</h1>
     <p className="hero-description">
      WELL.IO is transforming healthcare with cutting-edge AI that monitors patient health in real time—whether in hospitals, clinics, or at home. We deliver instant insights, predictive alerts, and a seamless experience for care teams and families alike.
     </p>
     <div className="hero-buttons">
      <button className="hero-btn primary-btn">Book a Demo</button>
      <button className="hero-btn secondary-btn">Learn More</button>
     </div>
    </div>
    <div className="hero-animation">
     <DotLottieReact
      src="https://lottie.host/9da1b5c8-f30f-4d1b-9330-e11edb988d3b/YrhIuHc7rH.lottie"
      loop
      autoplay
     />
    </div>
   </div>
  </div>
 );
}
