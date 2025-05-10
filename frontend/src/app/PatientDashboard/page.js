'use client';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';
import "./PatientDashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [aiTip, setAiTip] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [vitalsSnapshot, setVitalsSnapshot] = useState(null);

  // Update snapshot every 10 minutes
  useEffect(() => {
    const updateSnapshot = () => {
      if (vitals) {
        setVitalsSnapshot({
          ...vitals.vitals,
          age: vitals.age,
          gender: vitals.gender,
        });
      }
    };

    updateSnapshot(); // initial call
    const interval = setInterval(updateSnapshot, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, [vitals]);

  // Fetch user and vitals data on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
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

        // Fetch vitals data
        const vitalsRes = await fetch('http://localhost:4000/api/vitals');
        const vitalsData = await vitalsRes.json();
        const foundVitals = vitalsData.find(v => v.email === email);
        setVitals(foundVitals || null);

      } catch (error) {
        console.error('❗ Error fetching user or vitals:', error);
      }
    };

    fetchUserDetails();
  }, []);

  // Fetch AI data when snapshot changes (every 10 minutes)
 useEffect(() => {
  if (!vitalsSnapshot || !user) return;

  const fetchAI = async () => {
    try {
      const staticData = {
        age: vitals.age,
        gender: vitals.gender,
        height: vitals.height,
        weight: vitals.weight,
        bloodGroup: vitals.bloodGroup,
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

      const res = await fetch('http://localhost:4000/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitals: vitalsSnapshot, 
          staticData, 
        }),
      });

      const data = await res.json();
      setAiSummary(data.overview || '');
      setAiTip(data.tip || '');
    } catch (err) {
      console.error('🧠 AI fetch error:', err);
    }
  };

  fetchAI();
}, [vitalsSnapshot, user]);


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

        <div className='Ai-tip'>
          <strong>AI Tip:</strong> {aiTip || 'Loading tip...'}
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
          <p><strong>Overview:</strong> {aiSummary || 'Loading summary...'}</p>
        </div>
      </div>
    </div>
  );
}