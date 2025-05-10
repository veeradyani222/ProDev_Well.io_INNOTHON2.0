'use client';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';
import "./PatientDashboard.css";


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ No token found in localStorage');
          return;
        }

        const decoded = jwt.decode(token);
        const email = decoded?.user?.email;
        if (!email) {
          console.error('❌ Email not found in decoded token');
          return;
        }

        const usersRes = await fetch('https://wellio-backend.onrender.com/allusers');
        const usersData = await usersRes.json();
        const foundUser = usersData.find(u => u.email === email);
        setUser(foundUser || null);

        const interval = setInterval(async () => {
          const vitalsRes = await fetch('https://wellio-backend.onrender.com/api/vitals');
          const vitalsData = await vitalsRes.json();
          const foundVitals = vitalsData.find(v => v.email === email);
          setVitals(foundVitals || null);
        }, 3000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('❗ Failed to decode token or fetch data:', error);
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <div className="dashboard">
      <div className="left-side">
        <h1 className="text-xl font-bold mb-4">Patient Dashboard</h1>
        {user ? (
          <div className="user-info mb-4">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p>Loading user data...</p>
        )}

        {vitals ? (
          <div className="card-grid">
            <div className="vital-card">
              <div className="card-header">Age</div>
              <div className="card-body">{vitals.age}</div>
            </div>
            <div className="vital-card">
              <div className="card-header">Gender</div>
              <div className="card-body">{vitals.gender}</div>
            </div>
            <div className="vital-card">
              <div className="card-header">Heart Rate</div>
              <div className="card-body">{vitals.vitals.heartbeat} bpm</div>
            </div>
            <div className="vital-card">
              <div className="card-header">Blood Pressure</div>
              <div className="card-body">{vitals.vitals.bloodPressure} mmHg</div>
            </div>
            <div className="vital-card">
              <div className="card-header">Breathing Rate</div>
              <div className="card-body">{vitals.vitals.breathingRate} bpm</div>
            </div>
            <div className="vital-card">
              <div className="card-header">Oxygen Level</div>
              <div className="card-body">{vitals.vitals.oxygenLevel}%</div>
            </div>
            <div className="vital-card">
              <div className="card-header">Temperature</div>
              <div className="card-body">{vitals.vitals.temperature}°C</div>
            </div>
          </div>
        ) : (
          <p>Loading vitals...</p>
        )}
      </div>



      <div className="right-side">
        <div className="doctor-info">
          <h3>Your Doctor</h3>
          <p><strong>Dr. Smith</strong></p>
          <p>General Physician</p>
          <button className="talk-button">Talk Now</button>
        </div>
      </div>
    </div>
  );
}
