'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import './PatientProfile.css';

const PatientProfile = () => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const params = useParams();
  const email = decodeURIComponent(params.email);
  const insightsRef = useRef(null);


  
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('https://wellio-backend.onrender.com/api/vitals');
        if (!response.ok) {
          throw new Error('Failed to fetch vitals data');
        }

        const allVitals = await response.json();
        const patientData = allVitals.find(entry => entry.email === email);
        
        if (!patientData) {
          throw new Error('Patient not found in vitals data');
        }

        setPatient(patientData);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [email]);

  const fetchDoctorInsights = async () => {
    if (!patient) return;
    
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      
      const response = await fetch('http://localhost:4000/api/doctor-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vitals: patient.vitals,
          staticData: {
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            height: patient.height,
            weight: patient.weight,
            bloodGroup: patient.bloodGroup,
            allergies: patient.allergies,
            medications: patient.medications,
            medicalHistory: patient.medicalHistory,
            familyHistory: patient.familyHistory,
            lifestyle: patient.lifestyle,
            sleep: patient.sleep,
            diet: patient.diet,
            exercise: patient.exercise,
            stressLevel: patient.stressLevel,
            hydration: patient.hydration,
            smoking: patient.smoking,
            alcohol: patient.alcohol,
            caffeine: patient.caffeine,
            screenTime: patient.screenTime
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get insights');
      }

      setInsights(data.insights);
      scrollToInsights();
    } catch (err) {
      console.error('Error fetching insights:', err);
      setInsightsError(err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  const scrollToInsights = () => {
    insightsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="loading-container">Loading patient data...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  if (!patient) {
    return <div className="not-found-container">Patient not found</div>;
  }

  return (
    <div className="patient-profile-container">
      {/* Header with Insights Button */}
      <header className="profile-header">
        <div className="header-content">
          <div>
            <h1>Patient Profile</h1>
            <p>Comprehensive health overview for {patient.name}</p>
          </div>
          <button 
            onClick={fetchDoctorInsights}
            className="insights-button"
            disabled={insightsLoading}
          >
            {insightsLoading ? (
              <span>Generating Insights...</span>
            ) : (
              <span>View AI Insights about {patient.name}'s Health</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Patient Card */}
      <section className="patient-card">
        <div className="patient-basic-info">
          <div className="patient-avatar">
            <span>{patient.name.charAt(0)}</span>
          </div>
          <div className="patient-details">
            <h2>{patient.name}</h2>
            <p className="patient-email">{patient.email}</p>
            <div className="patient-meta">
              <span><strong>Age:</strong> {patient.age}</span>
              <span><strong>Gender:</strong> {patient.gender}</span>
              <span><strong>Blood Group:</strong> {patient.bloodGroup}</span>
            </div>
          </div>
        </div>

        <div className="patient-stats">
          <div className="stat-item">
            <span className="stat-value">{patient.height} cm</span>
            <span className="stat-label">Height</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{patient.weight} kg</span>
            <span className="stat-label">Weight</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {(patient.weight / ((patient.height/100) * (patient.height/100))).toFixed(1)}
            </span>
            <span className="stat-label">BMI</span>
          </div>
        </div>
      </section>

      {/* Health Sections */}
      <div className="health-sections">
        {/* Lifestyle Section */}
        <section className="health-section lifestyle-section">
          <h3>Lifestyle</h3>
          <div className="section-grid">
            <div className="info-item">
              <span className="info-label">Activity Level</span>
              <span className="info-value">{patient.lifestyle || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Exercise</span>
              <span className="info-value">{patient.exercise || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Sleep</span>
              <span className="info-value">{patient.sleep || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Diet</span>
              <span className="info-value">{patient.diet || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Stress Level</span>
              <span className="info-value">{patient.stressLevel || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Hydration</span>
              <span className="info-value">{patient.hydration || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Habits Section */}
        <section className="health-section habits-section">
          <h3>Habits</h3>
          <div className="section-grid">
            <div className="info-item">
              <span className="info-label">Smoking</span>
              <span className="info-value">{patient.smoking || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Alcohol</span>
              <span className="info-value">{patient.alcohol || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Caffeine</span>
              <span className="info-value">{patient.caffeine || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Screen Time</span>
              <span className="info-value">{patient.screenTime || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Medical History Section */}
        <section className="health-section medical-section">
          <h3>Medical History</h3>
          <div className="section-grid">
            <div className="info-item">
              <span className="info-label">Allergies</span>
              <span className="info-value">{patient.allergies || 'None reported'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Medications</span>
              <span className="info-value">{patient.medications || 'None'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Medical History</span>
              <span className="info-value">{patient.medicalHistory || 'None significant'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Family History</span>
              <span className="info-value">{patient.familyHistory || 'None significant'}</span>
            </div>
          </div>
        </section>

        {/* Vitals Section */}
        <section className="health-section vitals-section">
          <h3>Current Vitals</h3>
          <div className="vitals-grid">
            <div className="vital-card">
              <div className="vital-icon">❤️</div>
              <div className="vital-info">
                <span className="vital-value">{patient.vitals?.heartbeat || 'N/A'} bpm</span>
                <span className="vital-label">Heart Rate</span>
              </div>
            </div>
            <div className="vital-card">
              <div className="vital-icon">🩸</div>
              <div className="vital-info">
                <span className="vital-value">{patient.vitals?.bloodPressure || 'N/A'}</span>
                <span className="vital-label">Blood Pressure</span>
              </div>
            </div>
            <div className="vital-card">
              <div className="vital-icon">🌡️</div>
              <div className="vital-info">
                <span className="vital-value">{patient.vitals?.temperature || 'N/A'}°F</span>
                <span className="vital-label">Temperature</span>
              </div>
            </div>
            <div className="vital-card">
              <div className="vital-icon">💨</div>
              <div className="vital-info">
                <span className="vital-value">{patient.vitals?.breathingRate || 'N/A'} rpm</span>
                <span className="vital-label">Breathing Rate</span>
              </div>
            </div>
            <div className="vital-card">
              <div className="vital-icon">🫁</div>
              <div className="vital-info">
                <span className="vital-value">{patient.vitals?.oxygenLevel || 'N/A'}%</span>
                <span className="vital-label">Oxygen Level</span>
              </div>
            </div>
            <div className="vital-card">
              <div className="vital-icon">🏃</div>
              <div className="vital-info">
                <span className="vital-value">{patient.vitals?.steps || 'N/A'}</span>
                <span className="vital-label">Daily Steps</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* AI Insights Section */}
      <section className="insights-section" ref={insightsRef}>
        <div className="section-header">
          <h3>AI-Powered Health Insights</h3>
          {insights && (
            <button 
              onClick={fetchDoctorInsights}
              className="refresh-button"
              disabled={insightsLoading}
            >
              {insightsLoading ? 'Refreshing...' : 'Refresh Insights'}
            </button>
          )}
        </div>
        
        {insightsError && (
          <div className="error-message">
            <span>⚠️ {insightsError}</span>
            <button onClick={fetchDoctorInsights}>Try Again</button>
          </div>
        )}

        {insightsLoading ? (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Analyzing patient data...</p>
          </div>
        ) : insights ? (
          <div className="insights-content">
            <div className="insight-block">
              <h4>Health Summary</h4>
              <p>{insights.summary}</p>
            </div>

            <div className="insight-block">
              <h4>Notable Findings</h4>
              <ul>
                {insights.abnormalities.split('\n')
                  .filter(item => item.trim())
                  .map((item, i) => (
                    <li key={i}>{item.trim()}</li>
                  ))}
              </ul>
            </div>

            <div className="insight-block">
              <h4>Risk Factors</h4>
              <ul>
                {insights.risks.split('\n')
                  .filter(item => item.trim())
                  .map((item, i) => (
                    <li key={i}>{item.trim()}</li>
                  ))}
              </ul>
            </div>

            <div className="insight-block">
              <h4>Recommendations</h4>
              <ol>
                {insights.actions.split('\n')
                  .filter(item => item.trim())
                  .map((item, i) => (
                    <li key={i}>{item.trim()}</li>
                  ))}
              </ol>
            </div>

            <div className="insight-block">
              <h4>Follow-up Plan</h4>
              <ul>
                {insights.followup.split('\n')
                  .filter(item => item.trim())
                  .map((item, i) => (
                    <li key={i}>{item.trim()}</li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No insights generated yet</p>
            <p>Click the button above to get AI-powered health analysis</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientProfile;