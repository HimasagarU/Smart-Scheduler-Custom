# Smart Scheduler Custom

A full-stack intelligent scheduling application built with a FastAPI (Python) backend and a React (Vite) frontend. 

## Features
- **Dynamic Slot Finding**: An intelligent sliding-window algorithm that factors in preferred weekdays, avoid days, and public holidays to find the absolute best consecutive free days for your schedule.
- **Google Calendar-style UI**: A fully custom, responsive frontend built with React that renders user events and public holidays cleanly in an aesthetic grid view.
- **Event Reminders**: Built-in background task scheduler (APScheduler) which automatically sends you an email reminder prior to your scheduled event!
- **JWT Authentication**: Secure user login, session management, and encrypted configurations.

## Table of Contents
- [Installation](#installation)
- [Backend Setup (.env)](#backend-setup)
- [Frontend Setup](#frontend-setup)

---

## Installation

**1. Download the Project**
- **Via ZIP**: On the GitHub repository page, click the green `<> Code` button and select **"Download ZIP"**. Extract the ZIP file to your desired folder on your computer.
- **Via Git Clone**:
  ```bash
  git clone https://github.com/HimasagarU/Smart-Scheduler-Custom.git
  cd Smart-Scheduler-Custom
  ```

---

## Backend Setup

The backend is built with Python 3 and FastAPI, using MongoDB for data storage and APScheduler for email reminders.

**1. Navigate to the backend directory:**
```bash
cd backend
```

**2. Create a Virtual Environment & Install Dependencies:**
It is highly recommended to use a virtual environment.
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

**3. Configure Environment Variables (`.env`):**
Create a new file named exactly `.env` directly inside the `backend/` folder and paste the following configuration details into it:
```env
# MongoDB Connection String (Ensure you have MongoDB installed and running locally on port 27017, or replace with an Atlas URI)
MONGO_URI=mongodb://localhost:27017

# JWT Authentication
JWT_SECRET=super_secret_dev_key_12345
JWT_EXPIRE_MINUTES=1440

# Email configurations for APScheduler Reminders (Required for email functionality)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
> **Note for Gmail Users:** If you are using a Gmail address for `SMTP_EMAIL`, you cannot use your standard password. You must generate a 16-character "App Password" via your Google Account's 2-Step Verification security settings and paste it into `SMTP_PASSWORD` without spaces.

**4. Start the Backend Server:**
```bash
uvicorn main:app --reload --port 8000
```
The backend API will now be running continuously on `http://localhost:8000`. Leave this terminal window running.

---

## Frontend Setup

The frontend is built with React and Vite.

**1. Navigate to the frontend directory:**
Open a *new* separate terminal window/tab so your backend isn't interrupted, and navigate to the frontend:
```bash
cd frontend
```

**2. Install Node Dependencies:**
Ensure you have Node.js installed, then run:
```bash
npm install
```

**3. Start the Frontend Development Server:**
```bash
npm run dev
```

**4. Explore the App:**
Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`). Create an account, browse the Dashboard, and begin scheduling events!
