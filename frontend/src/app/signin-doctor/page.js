'use client';
import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './signin.css'; // Keeping the same CSS file
import Arrow from './../assets/arrow-right.png';

export default function DoctorSignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('https://wellio-backend.onrender.com/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        router.push('/doctor-dashboard'); // Redirect to doctor dashboard
      } else {
        setError(data.errors || 'Login failed.');
      }
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div>
      <div className='container1'>
        <div className='headd3'>
          Not a member yet? <Link href="/signup-doctor">Join Now</Link>
        </div>
      </div>

      <div className='signup-container'>
        <div className='signupheads'>
          <div className='head1'>CHECK UP ON YOUR PATIENTS</div>
          <div className='head2'>Sign in to continue</div>
        </div>

        <form onSubmit={handleSubmit} className='inputs-form'>
          <div className='input-order'>
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className='input-order'>
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <button className="signinbtn" type="submit">
            <div>Proceed to my Account</div>
            <Image src={Arrow} alt="Go" className="social-icon" width={40} height={40} />
          </button>
        </form>

        <div className='oruseconts'>
          <div className='oruse'>OR USE</div>
        </div>

        <div className='oruseconts'>
          <div className='oruse'>
            <Link href="/ForgotPasswordDoctor" className='forgot-password'>Having Issues with your password?</Link>
          </div>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}
