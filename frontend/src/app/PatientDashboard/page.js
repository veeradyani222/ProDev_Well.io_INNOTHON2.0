'use client';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';

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

       

        // Fetch users
        const usersRes = await fetch('https://wellio-backend.onrender.com/allusers');
        const usersData = await usersRes.json();
       

        // Find matching user
        const foundUser = usersData.find(u => u.email === email);

       
        setUser(foundUser || null);

        // Now fetch vitals every 3 seconds
        const interval = setInterval(async () => {
          const vitalsRes = await fetch('https://wellio-backend.onrender.com/api/vitals');
          const vitalsData = await vitalsRes.json();
      

          const foundVitals = vitalsData.find(v => v.email === email);
          setVitals(foundVitals || null);
        }, 3000); // 3000ms = 3 seconds

        // Cleanup the interval on component unmount
        return () => clearInterval(interval);
      } catch (error) {
        console.error('❗ Failed to decode token or fetch data:', error);
      }
    };

    fetchUserDetails();
  }, []);


  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Patient Dashboard</h1>
      {user ? (
        <div className="mb-4">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}

      {vitals ? (
        <div>
          <p><strong>Age:</strong> {vitals.age}</p>
          <p><strong>Gender:</strong> {vitals.gender}</p>
          <p><strong>Heart Rate:</strong> {vitals.vitals.heartbeat}</p>
          <p><strong>Blood Pressure:</strong> {vitals.vitals.bloodPressure}</p>
          <p><strong>Breathing Rate:</strong> {vitals.vitals.breathingRate}</p>
          <p><strong>Oxygen Level:</strong> {vitals.vitals.oxygenLevel}</p>
          <p><strong>Temperature:</strong> {vitals.vitals.temperature}</p>
        </div>
      ) : (
        <p>Loading vitals...</p>
      )}
    </div>
  );
}
