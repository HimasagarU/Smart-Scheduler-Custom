<div align="center">
  <h1>📅 Smart Scheduler</h1>
  <p><strong>A full-stack intelligent scheduling application built with a FastAPI (Python) backend and a React (Vite) frontend.</strong></p>
</div>

---

## 📖 Overview

Smart Scheduler represents an innovative way to bypass the cognitive load of matching schedules. Instead of manually scanning your calendar to figure out which days you are free, Smart Scheduler utilizes a smart sliding-window algorithm that automatically discovers the **absolute best consecutive free days**. It factors in your requested "avoid days," public holidays, and existing events so you don't have to. 

## ✨ Key Features

- **🧠 Intelligent Slot Finding**: Our sliding-window algorithm automatically calculates and ranks the most optimal sequence of days for your scheduling needs, removing the overlap of weekends, your selected "avoid days", or public holidays.
- **🎨 Custom Calendar Interface**: A clean, modern, and highly responsive frontend built with **React** (`lucide-react`, `react-calendar`) that visually charts your events, public holidays, and preferred free slots.
- **📧 Automated Event Reminders**: Out-of-the-box email reminders using a built-in background task scheduler (`APScheduler`). Get an alert shortly before your event begins!
- **🔐 Secure JWT Authentication**: Robust user authentication and session management built using JSON Web Tokens (JWT), alongside secure password hashing via `passlib[bcrypt]`.
- **🚀 High Performance**: Powered by asynchronous Python (`FastAPI`), fetching data seamlessly from a NoSQL **MongoDB** database (`motor`).

## 🛠️ Technology Stack

### Backend
* **Python 3** & **FastAPI** (High-performance Async Web Framework)
* **MongoDB** (Database) & **Motor** (Async Driver)
* **APScheduler** (Background Job Scheduling & Email Reminders)
* **Passlib & Python-JOSE** (Bcrypt Hashing & JWT Auth)
* **Python-Holidays** (Dynamically calculating region-specific holidays)

### Frontend
* **React 19** & **Vite** (Lightning Fast Development Environment)
* **React Router DOM** (Client-side Routing)
* **Lucide React** (Beautiful, Consistent Iconography)
* **Axios** (Promise-based HTTP client for the browser)

---

## 📂 Project Structure

```
Smart-Scheduler-Custom/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # Route Handlers (auth, events, slots)
│   │   ├── core/             # Configuration & Security (JWT, Config)
│   │   ├── db/               # MongoDB Connection Logic
│   │   ├── models/           # Pydantic Schemas & DB Models
│   │   └── services/         # Business Logic & APScheduler Background tasks
│   ├── main.py               # FastAPI App Entrypoint
│   └── requirements.txt      # Python Dependencies
└── frontend/                 # React + Vite Application
    ├── public/               # Static base assets
    ├── src/
    │   ├── components/       # Reusable React UI Components
    │   ├── pages/            # View Pages (Dashboard, Login, Calendar)
    │   ├── App.jsx           # Root App Component & Router
    │   └── main.jsx          # React DOM Render Entry
    ├── package.json          # Node Dependencies & Scripts
    └── vite.config.js        # Vite Build Config
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/HimasagarU/Smart-Scheduler-Custom.git
cd Smart-Scheduler-Custom
```

### 2. Backend Setup
The backend requires Python 3 to be installed. It utilizes MongoDB for data persistence.

```bash
cd backend
python -m venv venv

# Activate Virtual Environment (Windows)
venv\Scripts\activate
# Activate Virtual Environment (Mac/Linux)
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

**Environment Variables (`.env`)**
Create a new file named exactly `.env` inside the `backend/` directory:
```env
# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017

# JWT Authentication Config
JWT_SECRET=super_secret_dev_key_12345
JWT_EXPIRE_MINUTES=1440

# Email configurations for APScheduler Reminders
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
> **Note on Gmail SMTP**: If you are using Gmail, standard passwords won't work. Generate an **App Password** via your Google Account's 2-Step Verification settings.

**Run the Backend Server:**
```bash
uvicorn main:app --reload --port 8000
```
> The API will be available at `http://localhost:8000`. You can visit `http://localhost:8000/docs` for the interactive Swagger UI.

### 3. Frontend Setup
Open a new terminal window to keep the backend running in the background.

```bash
cd frontend
npm install
npm run dev
```

> The application will run locally, usually on `http://localhost:5173`. Open this in your browser to start scheduling!

---

## 💡 How It Works (The Algorithm)

The Smart Scheduler relies on a specialized scheduling algorithm designed to find consecutive available days. When searching for slots:
1. **Fetch Preferences**: The system evaluates your chosen criteria (e.g., finding $N$ free days between start date $X$ and end date $Y$).
2. **Holiday Mapping**: It maps out public holidays via the `holidays` Python package for your specified country.
3. **Blackout Window Mapping**: Generates a fast lookup table comprising the user's "avoid days," country holidays, and pre-existing events.
4. **Sliding Window Validation**: A sliding window of size $N$ traverses the allowed timeline. Windows that overlap with a blackout day are instantly moved forward, preventing unnecessary checks. 
5. **Score & Sort**: Qualifying slots are presented back to the user seamlessly.

---

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome! 

1. **Fork** the project
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
