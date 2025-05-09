'use client';
import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './SignUp.css';
import Arrow from './../assets/arrow-right.png';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    about: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('signup');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('https://wellio-backend.onrender.com/doctor/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setStep('otpVerification');
      } else {
        setError(data.errors || 'Signup failed.');
      }
    } catch {
      setError('Signup failed.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('https://wellio-backend.onrender.com/doctor/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, verificationCode: otp.join('') }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("OTP Verified! Redirecting to Sign In...");
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError(data.errors || 'OTP verification failed.');
      }
    } catch {
      setError('OTP verification failed.');
    }
  };

  return (
    <div>
      <div className='container1'>
        <div className='head3'>
          Are you already a member? <Link href="/signin">Sign In</Link>
        </div>
      </div>
      <div className='signup-container'>
        {step === 'signup' ? (
          <div>
            <div className='signupheads'>
              <div className='head1'>CREATE AN ACCOUNT</div>
              <div className='head2'>Start here</div>
            </div>
            <form onSubmit={handleSubmit} className='inputs-form'>
              <div className='input-order'>
                <label>Your Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className='input-order'>
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className='input-order'>
                <label>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div className='input-order'>
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required />
              </div>
              <div className='input-order'>
                <label>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className='input-order'>
                <label>About (Optional)</label>
                <textarea name="about" value={formData.about} onChange={handleChange} />
              </div>
              <button type="submit" className="submit-btn">Get Started</button>
            </form>
            <div className='orusecont'><div className='oruse'> Or Use </div></div>
          </div>
        ) : (
          <div>
            <div className="signupheads"><div className='head1'>VERIFY YOUR EMAIL</div></div>
            <form onSubmit={handleOtpSubmit} className='inputs-form'>
              <div className="otp-container">
                {Array(6).fill("").map((_, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                  />
                ))}
              </div>
              <button className="signinbtn" type="submit">
                <div>Proceed</div>
                <Image src={Arrow} alt="Go" className="social-icon" width={40} height={40} />
              </button>
            </form>
          </div>
        )}
        <div className='signupheads'>
          {error && <div className='head2' style={{ color: 'red' }}>{error}</div>}
          {message && <div className='head2' style={{ color: 'green' }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
