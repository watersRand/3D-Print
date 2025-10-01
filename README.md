# 🚀 3D Print Order & M-Pesa Automation Service

This is a **serverless application** built with **Node.js** and **Express** that manages the entire lifecycle of a 3D printing order — from **file upload** and **M-Pesa payment processing** to **Google Cloud Storage (GCS) archival** and **administrative tracking**.

It is designed to run efficiently on **Google Cloud Run**, taking advantage of **scale-to-zero** capabilities for cost optimization.

---

## ✨ Features

- **🔒 Secure File Upload**: Users can upload 3D model files (`.stl`, `.obj`, `.gltf`, `.glb`, `.ply`).
- **📲 M-Pesa STK Push Integration**: Initiates **Lipa na M-Pesa Online** checkout request directly to the user's phone.
- **⚡ Real-time Callback Handling**: Dedicated endpoint processes M-Pesa confirmation callbacks at `/api/mpesa/callback`.
- **☁️ Google Cloud Storage Integration**: Successful payments trigger automatic upload of the file to a **GCS bucket**.
- **🗄️ Database Tracking**: MongoDB (via **Mongoose**) tracks payment status, M-Pesa Reference IDs, and collection deadlines.
- **📧 Email Notifications**: Customers receive an order confirmation email after payment & file upload.
- **📊 Admin Dashboard**: Secure dashboard for viewing orders, payment status, and downloading files.

---

## 🛠️ Tech Stack

| **Component**     | **Technology**                | **Role**                                                   |
|--------------------|-------------------------------|-------------------------------------------------------------|
| **Backend**        | Node.js, Express             | Core application server & routing                          |
| **Database**       | MongoDB Atlas, Mongoose      | Persistent storage for order metadata & payment status      |
| **Cloud Storage**  | Google Cloud Storage (GCS)   | Scalable & secure storage for 3D model files               |
| **Payments**       | M-Pesa Daraja API (STK Push) | Mobile payments integration                                |
| **Deployment**     | Docker, Google Cloud Run     | Serverless, containerized hosting with **scale-to-zero**   |

---

## ⚙️ Local Setup

### 1. Clone the repository
~bash
git clone https://github.com/watersRand/3D-Print.git

cd 3d-print-mpesa-app
### 2. Install Dependancies
npm install
### 3. Configure environment variables
 Database
MONGO_URI=mongodb://localhost:27017/...

 Google Cloud Storage
GCS_BUCKET=...
GOOGLE_APPLICATION_CREDENTIALS=..

 M-Pesa Credentials (Sandbox)
MPESA_KEY=...
MPESA_SECRET=...
MPESA_PASSKEY=...
MPESA_SHORTCODE=174379

 Email (using Gmail App Password)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

 Local Base URL (for ngrok testing)
BASE_URL=https://[NGROK_TUNNEL_URL]

## 4. Start the Application
npm start
