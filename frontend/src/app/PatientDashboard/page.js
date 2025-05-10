'use client';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';
import "./PatientDashboard.css";
import Image from 'next/image';

// Import icons
import HeartRateIcon from './../assets/icons/heart-pulse-2-svgrepo-com.svg';
import BloodPressureIcon from './../assets/icons/blood-medical-medicine-svgrepo-com.svg';
import BreathingRateIcon from './../assets/icons/lungs-svgrepo-com.svg';
import OxygenLevelIcon from './../assets/icons/oxygen-svgrepo-com.svg';
import TemperatureIcon from './../assets/icons/low-temprature-temperature-svgrepo-com.svg';
import HeartRateVariabilityIcon from './../assets/icons/heart-beat-graph-svgrepo-com.svg';
import VO2MaxIcon from './../assets/icons/oxygen-svgrepo-com (1).svg';
import SleepDurationIcon from './../assets/icons/sleep-svgrepo-com.svg';
import StepsIcon from './../assets/icons/foot-sign-svgrepo-com.svg';
import CaloriesBurnedIcon from './../assets/icons/calories-svgrepo-com.svg';
import NoiseLevelIcon from './../assets/icons/sound-volume-2-svgrepo-com.svg';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [aiTip, setAiTip] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    const fetchUserVitalsAndDoctor = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = jwt.decode(token);
        const email = decoded?.user?.email;
        if (!email) return;

        // Fetch user data
        const usersRes = await fetch('https://wellio-backend.onrender.com/allusers');
        const usersData = await usersRes.json();
        const foundUser = usersData.find(u => u.email === email);
        setUser(foundUser || null);

        // Fetch doctor data
        if (foundUser?.doctor) {
          const doctorsRes = await fetch('https://wellio-backend.onrender.com/alldoctors');
          const doctors = await doctorsRes.json();
          const matchedDoctor = doctors.find(d => d.email === foundUser.doctor);
          setDoctor(matchedDoctor || null);
        }

        // Fetch vitals with polling
        const fetchVitals = async () => {
          const vitalsRes = await fetch('http://localhost:4000/api/vitals');
          const vitalsData = await vitalsRes.json();
          const foundVitals = vitalsData.find(v => v.email === email);
          setVitals(foundVitals || null);
        };

        fetchVitals();
        const interval = setInterval(fetchVitals, 3000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchUserVitalsAndDoctor();
  }, []);

  useEffect(() => {
    if (!vitals || !user) return;

    const fetchAIInsights = async () => {
      try {
        const vitalsHistory = vitals.history?.slice(-10) || [];
        const staticData = {
          allergies: vitals.allergies,
          medications: vitals.medications,
          medicalHistory: vitals.medicalHistory,
          familyHistory: vitals.familyHistory,
          lifestyle: vitals.lifestyle,
          sleep: vitals.sleep,
          diet: vitals.diet,
          exercise: vitals.exercise,
          stressLevel: vitals.stressLevel,
          hydration: vitals.hydration,
          smoking: vitals.smoking,
          alcohol: vitals.alcohol,
          caffeine: vitals.caffeine,
          screenTime: vitals.screenTime,
        };

        const res = await fetch('https://wellio-backend.onrender.com/api/get-health-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vitalsHistory, staticData }),
        });

        const data = await res.json();
        setAiTip(data.tip);
        setAiSummary(data.summary);
      } catch (err) {
        console.error('AI fetch error:', err);
      }
    };

    fetchAIInsights();
  }, [vitals, user]);

  if (!user || !vitals) {
    return (
      <div className="dashboard">
        <div className="left-side">
          <div className="loading-spinner">Loading patient data...</div>
        </div>
      </div>
    );
  }


  // Vital cards data
  const vitalCards = [
    { label: "Heart Rate", value: vitals.vitals.heartbeat, unit: "bpm", icon: HeartRateIcon },
    { label: "Blood Pressure", value: vitals.vitals.bloodPressure, unit: "mmHg", icon: BloodPressureIcon },
    { label: "Breathing Rate", value: vitals.vitals.breathingRate, unit: "bpm", icon: BreathingRateIcon },
    { label: "Oxygen Level", value: vitals.vitals.oxygenLevel, unit: "%", icon: OxygenLevelIcon },
    { label: "Temperature", value: vitals.vitals.temperature, unit: "°C", icon: TemperatureIcon },
    { label: "HR Variability", value: vitals.vitals.heartRateVariability, unit: "ms", icon: HeartRateVariabilityIcon },
    { label: "VO2 Max", value: vitals.vitals.vo2Max, unit: "ml/kg/min", icon: VO2MaxIcon },
    { label: "Sleep Duration", value: vitals.vitals.sleepDuration, unit: "hrs", icon: SleepDurationIcon },
    { label: "Steps", value: vitals.vitals.steps, unit: "steps", icon: StepsIcon },
    { label: "Calories Burned", value: vitals.vitals.caloriesBurned, unit: "kcal", icon: CaloriesBurnedIcon },
    { label: "Noise Level", value: vitals.vitals.noiseLevel, unit: "dB", icon: NoiseLevelIcon },
  ];

  // Personal info data
  const personalInfo = [
    { label: "Age", value: vitals.age || 'N/A' },
    { label: "Gender", value: vitals.gender || 'N/A' },
    { label: "Height", value: vitals.height ? `${vitals.height} cm` : 'N/A' },
    { label: "Weight", value: vitals.weight ? `${vitals.weight} kg` : 'N/A' },
    { label: "Blood Group", value: vitals.bloodGroup || 'N/A' },
  ];

  // Health history data
  const healthHistory = [
    { label: "Allergies", value: vitals.allergies || 'None reported' },
    { label: "Medications", value: vitals.medications || 'None reported' },
    { label: "Medical History", value: vitals.medicalHistory || 'None reported' },
    { label: "Family History", value: vitals.familyHistory || 'None reported' },
  ];

  // Lifestyle data
  const lifestyleInfo = [
    { label: "Activity Level", value: vitals.lifestyle || 'N/A' },
    { label: "Sleep Quality", value: vitals.sleep || 'N/A' },
    { label: "Diet", value: vitals.diet || 'N/A' },
    { label: "Exercise", value: vitals.exercise || 'N/A' },
    { label: "Stress Level", value: vitals.stressLevel || 'N/A' },
    { label: "Hydration", value: vitals.hydration || 'N/A' },
  ];

  return (
    <div className="dashboard">
      {/* Left Side - Patient Data */}
      <div className="left-side">
        {/* Patient Header */}
        <div className="patient-header">
          <h1>{user.name}'s Health Dashboard</h1>
          <div className="patient-meta">
            {/* <span>Patient ID: {user._id || 'N/A'}</span> */}
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Vitals Section */}
        <div className="vitals-section">
          <h2 className="section-title">Current Vitals</h2>
          <div className="vital-cards-grid">
            {vitalCards.map((vital, index) => (
              <div className="vital-card" key={index}>
                <Image src={vital.icon} className="vital-icon" alt={`${vital.label} icon`} />
                <span className="vital-label">{vital.label}</span>
                <span className="vital-value">{vital.value || '--'}</span>
                <span className="vital-unit">{vital.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Information */}
        <div className="patient-info-section">
          <h2 className="section-title">Personal Information</h2>
          <div className="info-grid">
            {personalInfo.map((info, index) => (
              <div className="info-item" key={index}>
                <span className="info-label">{info.label}</span>
                <span className="info-value">{info.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health History */}
        <div className="patient-info-section">
          <h2 className="section-title">Health History</h2>
          <div className="info-grid">
            {healthHistory.map((info, index) => (
              <div className="info-item" key={index}>
                <span className="info-label">{info.label}</span>
                <span className="info-value">{info.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="patient-info-section">
          <h2 className="section-title">Lifestyle</h2>
          <div className="info-grid">
            {lifestyleInfo.map((info, index) => (
              <div className="info-item" key={index}>
                <span className="info-label">{info.label}</span>
                <span className="info-value">{info.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Doctor Info */}
      <div className="right-side">
        {doctor && (
          <div className="doctor-card">
            <div className="doctor-header">
              <div className="doctor-avatar">
                {doctor.name.charAt(0)}
              </div>
              <div>
                <h3 className="doctor-name">{doctor.name}</h3>
                <p className="doctor-specialty">{doctor.specialty || 'General Practitioner'}</p>
              </div>
            </div>

            <div className="doctor-info-item">
              <span className="doctor-info-label">Email</span>
              <p className="doctor-info-value">{doctor.email}</p>
            </div>

            <div className="doctor-info-item">
              <span className="doctor-info-label">Address</span>
              <p className="doctor-info-value">{doctor.address || 'N/A'}</p>
            </div>

            <button className="contact-button">
              Contact Doctor
            </button>
          </div>
        )}

        <div className="ai-section">
          <h2 className="section-title">AI Health Insights</h2>
          <div className="ai-tip">
            <strong>Daily Tip:</strong> {aiTip || 'Analyzing your health data...'}
          </div>
          <p>{aiSummary || 'Generating personalized health summary...'}</p>
        </div>
      </div>
    </div>
  );
}