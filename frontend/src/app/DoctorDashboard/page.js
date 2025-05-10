'use client';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';
import { useRouter } from 'next/navigation';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const router = useRouter(); // Next.js router for navigation

  useEffect(() => {
    const fetchDoctorAndPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No token found in localStorage');
          return;
        }

        const decoded = jwt.decode(token);
        console.log('🧾 Decoded token:', decoded);

        const doctorEmail = decoded?.doctor?.email;
        if (!doctorEmail) {
          console.warn('⚠️ No doctor email found in token');
          return;
        }

        const doctorRes = await fetch('https://wellio-backend.onrender.com/alldoctors');
        const doctorsData = await doctorRes.json();
        console.log('📦 All doctors:', doctorsData);

        const foundDoctor = doctorsData.find(doc => doc.email === doctorEmail);
        if (!foundDoctor) {
          console.warn('⚠️ Doctor not found in doctor list');
          return;
        }

        setDoctor(foundDoctor);
        console.log('✅ Found doctor:', foundDoctor);

        const usersRes = await fetch('https://wellio-backend.onrender.com/allusers');
        const usersData = await usersRes.json();
        console.log('👥 All users:', usersData);

        const assignedPatients = usersData.filter(user =>
          foundDoctor.patients.includes(user.email)
        );

        console.log('🩺 Assigned patients:', assignedPatients);
        setPatients(assignedPatients);
      } catch (err) {
        console.error('❗ Error fetching doctor or patients:', err);
      }
    };

    fetchDoctorAndPatients();
  }, []);

  const handleViewProfile = (email) => {
  router.push(`/patient/${encodeURIComponent(email)}`);
  };

  return (
    <div className="doctor-dashboard">
      <h1 className="heading">Doctor Dashboard</h1>

      {doctor && (
        <div className="doctor-info">
          <p><strong>Name:</strong> {doctor.name}</p>
          <p><strong>Email:</strong> {doctor.email}</p>
        </div>
      )}

      <h2 className="subheading">Your Patients</h2>
      <div className="patient-list">
        {patients.map(patient => (
          <div className="patient-card" key={patient.email}>
            <p><strong>Name:</strong> {patient.name}</p>
            <p><strong>Email:</strong> {patient.email}</p>
            <p><strong>Status:</strong> {patient.status || 'N/A'}</p>
            <p><strong>Address:</strong> {patient.address}</p>
            <button
              className="view-profile-btn"
              onClick={() => handleViewProfile(patient.email)}
            >
              View Patient Profile
            </button>
          </div>
        ))}
        {patients.length === 0 && <p>No patients assigned yet.</p>}
      </div>
    </div>
  );
};

export default DoctorDashboard;
