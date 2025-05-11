'use client';
import { useState, useEffect } from 'react';
import './AskAI.css';
import jwt from 'jsonwebtoken';

const AskAI = () => {
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState(null);

  // Categories of questions
  const questionCategories = [
    {
      title: '🌡️ General Health',
      questions: [
        "How is my overall health looking today?",
        "Do you notice anything unusual in my vitals?",
        "Can you give me a quick health summary?",
        "Am I at risk for anything based on my current stats?"
      ]
    },
    {
      title: '❤️ Vitals Analysis',
      questions: [
        "Is my blood pressure in a healthy range?",
        "What does my heart rate indicate?",
        "Is my BMI okay for my age and height?",
        "What should I do about my sugar levels?"
      ]
    },
    {
      title: '🍽️ Nutrition Advice',
      questions: [
        "Based on my diet, am I eating healthy?",
        "Any food suggestions to improve my energy levels?",
        "Am I drinking enough water?",
        "How can I improve my nutrition?"
      ]
    },
    {
      title: '😴 Lifestyle Tips',
      questions: [
        "Is my sleep pattern healthy?",
        "Does my screen time affect my health?",
        "What's one thing I can do today to feel better?",
        "Do I need to exercise more?"
      ]
    },
    {
      title: '⚠️ Risk Assessment',
      questions: [
        "Am I showing early signs of any health issue?",
        "Is there anything I should be concerned about?",
        "Based on my family history, what should I watch out for?",
        "Can you alert me if something goes out of range?"
      ]
    }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const decoded = jwt.decode(token);
        const email = decoded?.user?.email;
        if (!email) throw new Error('User email not found in token');

        // Fetch user data
        const usersRes = await fetch('https://wellio-backend.onrender.com/allusers');
        const usersData = await usersRes.json();
        const foundUser = usersData.find(u => u.email === email);
        if (!foundUser) throw new Error('User not found');

        // Fetch vitals
        const vitalsRes = await fetch('http://localhost:4000/api/vitals');
        const vitalsData = await vitalsRes.json();
        const foundVitals = vitalsData.find(v => v.email === email);

        setUser(foundUser);
        setVitals(foundVitals || {});
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleQuestionClick = async (question) => {
    if (!user || !vitals || isResponding) return;
    
    try {
      setSelectedQuestion(question);
      setAiResponse(null);
      setIsResponding(true);
      setError(null);

      const response = await fetch('http://localhost:4000/api/health-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vitals: vitals,
          staticData: {
            name: user.name,
            age: user.age,
            gender: user.gender,
            height: user.height,
            weight: user.weight,
            bloodGroup: user.bloodGroup,
            allergies: user.allergies,
            medications: user.medications,
            medicalHistory: user.medicalHistory,
            familyHistory: user.familyHistory,
            lifestyle: user.lifestyle,
            sleep: user.sleep,
            diet: user.diet,
            exercise: user.exercise,
            stressLevel: user.stressLevel,
            hydration: user.hydration,
            smoking: user.smoking,
            alcohol: user.alcohol,
            caffeine: user.caffeine,
            screenTime: user.screenTime
          },
          question: question
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get AI response');

      setAiResponse(data.answer);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError(err.message);
    } finally {
      setIsResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="ask-ai-loading">
        <div className="spinner"></div>
        <p>Loading your health profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ask-ai-error">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="ask-ai-container">
      <header className="ask-ai-header">
        <h1>Health AI Assistant</h1>
        <p>Get personalized health insights based on your data</p>
      </header>

      <div className="ask-ai-layout">
        <div className="questions-panel">
          <h2>What would you like to know?</h2>
          
          {questionCategories.map((category, index) => (
            <div key={index} className="question-category">
              <h3 className="category-title">{category.title}</h3>
              <div className="question-grid">
                {category.questions.map((question, qIndex) => (
                  <button
                    key={qIndex}
                    className={`question-button ${selectedQuestion === question ? 'active' : ''}`}
                    onClick={() => handleQuestionClick(question)}
                    disabled={isResponding}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="response-panel">
          <div className="response-container">
            {selectedQuestion ? (
              <>
                <div className="question-display">
                  <span className="user-label">You asked:</span>
                  <p className="user-question">{selectedQuestion}</p>
                </div>

                {isResponding ? (
                  <div className="ai-thinking">
                    <div className="typing-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    <p>Analyzing your health data...</p>
                  </div>
                ) : error ? (
                  <div className="response-error">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                    <button onClick={() => handleQuestionClick(selectedQuestion)}>Try Again</button>
                  </div>
                ) : aiResponse ? (
                  <div className="ai-response">
                    <div className="ai-header">
                      <span className="ai-label">AI Health Assistant:</span>
                    </div>
                    <div className="ai-message">
                      <p>{aiResponse}</p>
                    </div>
                    <div className="ai-footer">
                      <small>Based on your current health data</small>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💡</div>
                <h3>Select a question to begin</h3>
                <p>Click any of the health questions to get personalized AI insights based on your medical data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskAI;