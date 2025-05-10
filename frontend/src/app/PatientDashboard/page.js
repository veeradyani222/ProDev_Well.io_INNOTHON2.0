'use client';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';
import "./PatientDashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [aiTip, setAiTip] = useState('');
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = jwt.decode(token);
        const email = decoded?.user?.email;
        if (!email) return;

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
        console.error('❗ Error fetching user or vitals:', error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (!vitals || !user) return;

    const fetchAI = async () => {
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
        console.error('🧠 AI fetch error:', err);
      }
    };

    fetchAI();
  }, [vitals, user]);

  const renderVitalCard = (label, value, unit = "") => (
    <div className="vital-card">
      <p className="vital-label">{label}</p>
      <p className="vital-value">
        {value}
        {unit}
      </p>
    </div>
  );

  if (!user || !vitals) return <p>Loading data...</p>;

  return (
    <div className="dashboard">
      {/* Left Side */}
      <div className="left-side">
        <h1 className="dashboard-heading">Patient Dashboard</h1>

        {/* User Info */}
        <div className="user-info">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        {/* Card Grid */}
        <div className="card-grid">
          {/* Basic Info */}
          <div className="vital-group basic-info">
            <h2>Basic Information</h2>
            <div className="vital-card-container">
              {renderVitalCard("Age", vitals.age)}
              {renderVitalCard("Gender", vitals.gender)}
              {renderVitalCard("Height", vitals.height, " cm")}
              {renderVitalCard("Weight", vitals.weight, " kg")}
              {renderVitalCard("Blood Group", vitals.bloodGroup)}
            </div>
          </div>

          {/* Health History */}
          <div className="vital-group health-history">
            <h2>Health History</h2>
            <div className="vital-card-container">
              {renderVitalCard("Allergies", vitals.allergies)}
              {renderVitalCard("Medications", vitals.medications)}
              {renderVitalCard("Medical History", vitals.medicalHistory)}
              {renderVitalCard("Family History", vitals.familyHistory)}
            </div>
          </div>

          {/* Lifestyle */}
          <div className="vital-group lifestyle-info">
            <h2>Lifestyle</h2>
            <div className="vital-card-container">
              {renderVitalCard("Lifestyle", vitals.lifestyle)}
              {renderVitalCard("Sleep", vitals.sleep)}
              {renderVitalCard("Diet", vitals.diet)}
              {renderVitalCard("Exercise", vitals.exercise)}
              {renderVitalCard("Stress Level", vitals.stressLevel)}
              {renderVitalCard("Hydration", vitals.hydration)}
              {renderVitalCard("Smoking", vitals.smoking)}
              {renderVitalCard("Alcohol", vitals.alcohol)}
              {renderVitalCard("Caffeine", vitals.caffeine)}
              {renderVitalCard("Screen Time", vitals.screenTime)}
            </div>
          </div>

          {/* Live Vitals */}
          <div className="vital-group live-vitals">
            <h2>Live Vitals</h2>
            <div className="vital-card-container">
              {renderVitalCard("Heart Rate", vitals.vitals.heartbeat, " bpm")}
              {renderVitalCard("Blood Pressure", vitals.vitals.bloodPressure, " mmHg")}
              {renderVitalCard("Breathing Rate", vitals.vitals.breathingRate, " bpm")}
              {renderVitalCard("Oxygen Level", vitals.vitals.oxygenLevel, "%")}
              {renderVitalCard("Temperature", vitals.vitals.temperature, "°C")}
              {renderVitalCard("Heart Rate Variability", vitals.vitals.heartRateVariability, " ms")}
              {renderVitalCard("VO2 Max", vitals.vitals.vo2Max, " ml/kg/min")}
              {renderVitalCard("Sleep Duration", vitals.vitals.sleepDuration, " hrs")}
              {renderVitalCard("Steps", vitals.vitals.steps)}
              {renderVitalCard("Calories Burned", vitals.vitals.caloriesBurned, " kcal")}
              {renderVitalCard("Noise Level", vitals.vitals.noiseLevel, " dB")}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="right-side">
        <div className="doctor-info">
          <h3>Your Doctor</h3>
          <p><strong>Dr. Smith</strong></p>
          <p className="doctor-specialty">General Physician</p>
          <button className="talk-button">Talk Now</button>
        </div>

        <div className="ai-health-section">
          <h3>🧠 AI Insights</h3>
          <p><strong>Tip:</strong> {aiTip || 'Loading tip...'}</p>
          <p><strong>Overview:</strong> {aiSummary || 'Loading summary...'}</p>
        </div>
      </div>
    </div>
  );
}
