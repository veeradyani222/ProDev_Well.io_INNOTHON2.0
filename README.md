# AI-Powered Remote Patient Monitoring System  

## 📌 Overview  
An *IoT-integrated AI system* that continuously monitors patient vitals, detects anomalies using AI, and alerts doctors in real-time. Built with *Next.js, Node.js, MongoDB, and OpenAI API*, this system provides two key dashboards:  
- *👨‍⚕ Doctor's Panel* – Monitor patients, receive alerts, and track health trends  
- *👤 Patient's Panel* – View personal health data and receive AI-driven insights  
 

## 🚀 Features  

### 1. Secure Authentication (JWT)  
- Role-based login for *doctors* and *patients*  
- JWT token-based authorization  

### 2. Doctor's Dashboard  
✔ *Real-time patient monitoring* (heart rate, SpO₂, BP, temperature)  
✔ *AI-powered anomaly detection* (OpenAI API)   
✔ *Add notes/update patient records*  

### 3. Patient's Dashboard  
✔ View *personal health metrics & trends*  
✔ Get *AI-generated health insights*    
✔ *Send queries* to assigned doctor  

### 4. AI & Backend Processing  
- *Fetches MongoDB data* at regular intervals  
- *Gemini 2.0 Flash API* analyzes vitals for anomalies  
- *Real-time alerts* via WebSockets  

### 5. MongoDB Database  
- Stores *patient records, vitals, and doctor assignments*  
- Optimized for *fast queries & scalability*  

## 🛠 Tech Stack  

| Category        | Technologies                          |
|-----------------|--------------------------------------|
| *Frontend*    | Next.js                  |
| *Backend*     | Node.js, Express.js                  |
| *Database*    | MongoDB (Atlas or local)             |
| *Authentication* | JWT (JSON Web Tokens)              |
| *AI Processing* | Gemini 2.0 Flash API (Anomaly Detection)     |
| *Real-Time Comms* | WebSockets (Socket.io)            |
| *Deployment*  | Vercel (Frontend), Render (Backend)  |

## ⚙ System Architecture  

1. *IoT Sensors* → Collect patient vitals (e.g., heart rate, SpO₂)  
2. *Node.js Backend* → Fetches data from *MongoDB* every minute  
3. *AI Processing* → Gemini 2.0 Flash API checks for anomalies  
4. *Real-Time Alerts* → Doctors get WebSocket notifications  
5. *Dashboards* → Next.js frontend for doctors & patients  

## 📂 MongoDB Data Structure  

### Collections:  
1. *Patients*  
2. *Doctors*

## 🔧 Setup & Deployment

### Prerequisites
- Node.js ≥ 16
- MongoDB (Local or Atlas)
- Gemini 2.0 Flash

### Installation
## Clone the repo
```bash
git clone https://github.com/your-repo.git](https://github.com/veeradyani222/ProDev_Well.io_INNOTHON2.0
```

## Install dependencies
```bash
# Frontend
cd frontend && npm install
# Backend
cd ../backend && npm install
```

## Configure Environment Variables
- Create .env in /backend:
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_pass
FRONTEND_URL=your_frontend_url
BACKEND_URL=your_backend_url
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

## Run the app
```bash
# Backend
npm run dev
# Frontend (in another terminal)
cd ../frontend && npm run dev
```

## Deploy on Vercel
1. Connect GitHub repo
2. Deploy!

## 📈 Future Enhancements
- *EHR Integration* (Electronic Health Records)
- *Voice Assistant* for patient queries
- *Predictive Analytics* for early disease detection

## 👥 Team ProDev
- Veer Adyani
- Vaidik Sule
- Shorya Jain

This project was made for INNOTHON 2.0, held at SKITM, Indore. (May 9 - May 11 2025)
