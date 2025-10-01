🚀 3D Print Order & M-Pesa Automation Service
This is a serverless application built with Node.js and Express that manages the entire lifecycle of a 3D printing order, from file upload and M-Pesa payment processing to final storage in Google Cloud Storage and administrative tracking.

It is designed to run efficiently on Google Cloud Run, taking advantage of its scale-to-zero capabilities for cost optimization.

✨ Features
Secure File Upload: Users can upload 3D model files (STL, OBJ, etc.).

M-Pesa STK Push Integration: Initiates Lipa na M-Pesa Online checkout request directly to the user's phone.

Real-time Callback Handling: Dedicated server endpoint handles the M-Pesa Confirmation callback (/api/mpesa/callback).

GCS Integration: Successful payments trigger the automatic upload of the file to a Google Cloud Storage bucket.

Database Tracking: Uses MongoDB (via Mongoose) to track payment status, M-Pesa Reference ID, and collection deadlines.

Email Notifications: Sends order confirmation emails to the customer upon successful payment and file upload.

Admin Dashboard: Provides a dashboard to view all orders, payment status, and secure download links.

🛠️ Tech Stack
Component

Technology

Role

Backend

Node.js, Express

Core application server and routing.

Database

Mongoose, MongoDB Atlas

Persistent storage for order metadata and payment status.

Cloud Storage

Google Cloud Storage (GCS)

Secure and scalable storage for large 3D model files.

Payment Gateway

M-Pesa Daraja API (STK Push)

Payment collection.

Deployment

Docker, Google Cloud Run

Serverless, containerized hosting with scale-to-zero efficiency.

⚙️ Local Setup
Clone the repository:

git clone https://github.com/watersRand/3D-Print/
cd 3d-print-mpesa-app

Install dependencies:

npm install

Environment Variables: Create a .env file in the project root to handle local configuration (do not commit this file to Git):

# Database
MONGO_URI=mongodb+srv://...

# Google Cloud Storage (GCS)
GCS_BUCKET=your-bucket-name

# M-Pesa Credentials
MPESA_KEY=...
MPESA_SECRET=...
MPESA_CREDENTIAL=...
MPESA_PASSKEY=...
MPESA_SHORTCODE=174379

# Nodemailer
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Base URL (for local testing, use a tunneling tool like ngrok)
BASE_URL=https://[NGROK_TUNNEL_URL]

Run the application:

npm start

☁️ Deployment to Google Cloud Run (Declarative Method)
This project uses a declarative deployment approach with a Dockerfile and a service.yaml file, ensuring repeatable and secure deployments.

Prerequisites
GCP Project: Ensure you have an active GCP project ([YOUR_GCP_PROJECT_ID]).

GCP CLI: Install and configure the gcloud command-line tool.

Service Account: Create a dedicated service account and grant it the Storage Object Admin role and the Cloud Run Invoker role.

Step 1: Configure YAML and Initial Deploy
Update cloudrun/service.yaml:

Replace all bracketed placeholders (e.g., [YOUR_GCP_PROJECT_ID], [YOUR_SERVICE_ACCOUNT_EMAIL], and all credential values) with your actual secrets.



Validation URL: [Your Cloud Run URL]/api/mpesa/callback
