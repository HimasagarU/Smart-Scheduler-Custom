<div align="center">
  <h1>📅 Smart Scheduler</h1>
  <p><strong>A full-stack intelligent scheduling application built with a FastAPI (Python) backend and a React (Vite) frontend.</strong></p>
</div>

---

## 📖 Overview

Smart Scheduler helps reduce the effort of matching schedules. Instead of manually scanning your calendar to find free days, it uses a sliding-window algorithm to automatically discover the **best consecutive free-day slots**. It considers your requested "avoid days," public holidays, and existing events.

## ✨ Key Features

*(For a deep-dive into how the algorithms handle edge cases like holidays and multi-user overlap, check out our [Project Report](./PROJECT_REPORT.md).)*

- **🧠 Intelligent Slot Finding:** Our core sliding-window algorithm discovers the optimal chronological sequence of free days while skipping weekends, user-defined "avoid days," and public holidays.
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
│   │   ├── db/               # MongoDB connection and data models
│   │   │   ├── models.py
│   │   │   └── mongodb.py
│   │   └── services/         # Business Logic & APScheduler Background tasks
│   ├── main.py               # FastAPI App Entrypoint
│   └── requirements.txt      # Python Dependencies
└── frontend/                 # React + Vite Application
    ├── public/               # Static base assets
    ├── src/
    │   ├── components/       # Reusable React UI Components
    │   ├── api/              # Axios and API integration helpers
    │   ├── pages/            # View Pages (Dashboard, Login, Calendar)
    │   ├── styles/           # Global and page-level styles
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

### 🐳 The Easiest Way: Using Docker (Recommended)

Don't want to install Python, Node.js, and MongoDB manually? You can run the entire project with one command using Docker!

**Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop).

#### Docker Installation (Windows)

1. Open [Docker Desktop](https://www.docker.com/products/docker-desktop).
2. Download **Docker Desktop for Windows**.
3. Run the installer and keep **Use WSL 2 instead of Hyper-V** enabled.
4. Restart your system if prompted.
5. Open Docker Desktop and wait until Docker Engine is running.

#### Docker Installation (macOS)

1. Open [Docker Desktop](https://www.docker.com/products/docker-desktop).
2. Download the correct build for your machine:
  - **Apple chip** (M1/M2/M3)
  - **Intel chip**
3. Open the `.dmg` file and drag Docker into **Applications**.
4. Launch Docker and finish first-time setup.
5. Wait until Docker Engine is running.

#### Run With Docker

1. Make sure **Docker Desktop** is open and running in the background.
2. Open the project folder (`Smart-Scheduler-Custom`) in **Visual Studio Code (VS Code)**.
3. Open a new terminal inside VS Code (Go to the top menu: **Terminal > New Terminal**).
4. (Optional but recommended) Create your `.env` file inside the `backend/` folder (see the `.env` guide below).
5. Run the following command in the terminal:
```bash
docker compose up -d --build
```
* **Frontend** will run on: `http://localhost`
* **Backend** handles data at: `http://localhost:8000`

> **Port Note:** In Docker mode, the frontend is exposed on port `80`, so `http://localhost` and `http://localhost:80` are equivalent. The backend runs on port `8000`.

To stop the app, simply run `docker compose down`.

---

### 💻 Manual Setup (For Development)

If you'd rather not use Docker, you can run everything manually. 

#### Backend Setup
You need **Python 3** and **MongoDB** installed on your computer.

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

#### Settings (`.env` file)
**What is a `.env` file?**
Think of a `.env` file as a secret "settings" file for your app. Just like you wouldn't write your banking password on a sticky note and leave it in a public library, developers don't write database passwords or email passwords directly into the code. Instead, we write them in a hidden `.env` file that stays on *your* computer and is never uploaded to GitHub. 

<details>
<summary><b>Why do we do this? (For the technically curious)</b></summary>
Hardcoding credentials directly into source code is a major security risk, potentially exposing secrets if the repository is made public. Using a `.env` file allows us to inject these secrets directly into the application's environment variables (`os.environ`) at runtime, completely separating the codebase from environment-specific configurations.
</details>

Create a new file named **exactly** `.env` inside the `backend/` folder and paste this in:

```env
# The address to your MongoDB database
MONGO_URI=mongodb://localhost:27017

# A random password to secure logins
JWT_SECRET=super_secret_dev_key_12345
JWT_EXPIRE_MINUTES=1440

# Email configurations for automated reminders
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
> **Note on Gmail SMTP**: If you are using Gmail, standard passwords won't work. Generate an **App Password** via your Google Account's 2-Step Verification settings.

**Run the Backend Server:**
```bash
uvicorn main:app --reload --port 8000
```
> The API will be available at `http://localhost:8000`. You can visit `http://localhost:8000/docs` for the interactive Swagger UI.

#### Frontend Setup
Open a **new** terminal window to keep the backend running.

```bash
cd frontend
npm install
npm run dev
```

> The application will run locally on `http://localhost:5173` (Vite dev server). Open this in your browser to start scheduling!

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
