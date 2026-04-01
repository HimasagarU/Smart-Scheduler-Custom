<div align="center">
  <h1>📅 Smart Scheduler</h1>
  <p><strong>A full-stack intelligent scheduling application built with a FastAPI (Python) backend and a React (Vite) frontend.</strong></p>
</div>

---

## 📖 Overview

Smart Scheduler represents an innovative way to bypass the cognitive load of matching schedules. Instead of manually scanning your calendar to figure out which days you are free, Smart Scheduler utilizes a smart sliding-window algorithm that automatically discovers the **absolute best consecutive free days**. It factors in your requested "avoid days," public holidays, and existing events so you don't have to. 

## ✨ Key Features

- **🧠 Intelligent Slot Finding:** Our core sliding-window algorithm discovers the optimal chronological sequence of free days, bypassing weekends, user-defined "avoid days," and public holidays map.
- **🕒 Deadline (Backward) Scheduling:** Need a task done *before* a specific date? The Deadline Scheduler works backwards from your deadline to find the latest possible free window.
- **🤝 Multi-User Overlap Finder:** Compare your schedule against a colleague's to automatically find mutually free days.
- **🏢 Organization-Based Consent:** Simply tag your account with your Organization name. If two users belong to the same Organization, they can instantly schedule and link shared events (👥) directly on each other's calendars without cumbersome invite loops.
- **🎨 Custom Calendar Interface:** A modern, highly responsive frontend built with **React** (`lucide-react`, `react-calendar`). Features clear color-coding, interactive modals, and distinct "Shared Event" markers. 
- **🧨 Smart Linked Deletions:** Event organizers can opt to remove an event just for themselves, or "Cancel for everyone"—which automatically unschedules email reminders and removes the calendar blocks for all participants.
- **📧 Automated Event Reminders:** Background task scheduler (`APScheduler`) sends email alerts before your event begins.
- **🔐 Secure JWT Authentication:** User authentication and session management via JSON Web Tokens (JWT) and `passlib[bcrypt]`.

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

The Smart Scheduler relies on specialized scheduling algorithms designed to find consecutive available days. 

1. **Forward Search:** Evaluates criteria (e.g., finding $N$ free days between start date $X$ and end date $Y$).
2. **Backward (Deadline) Search:** Searches in reverse from a strict deadline $Y$ to find the *latest* possible $N$ consecutive free days.
3. **Multi-User Overlap:** Combines the busy maps and blackout days of User A and User B to find the strict intersection of their free time.
4. **Holiday Mapping:** It maps out public holidays via the `holidays` Python package.
5. **Sliding Window Validation:** A sliding window of size $N$ traverses the allowed timeline. Windows that overlap with a blackout day are instantly moved forward, preventing unnecessary checks. 
6. **Shared Event Linking:** Valid overlapping slots between users in the same organization generate twin Event documents tied by a `parent_event_id`, ensuring synchronized deletions.

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
