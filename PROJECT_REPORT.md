## Team Member Details

* **Roll No:** S20220010229
  **Name:** HIMASAGAR ULLAMGUNTA
  **Contribution:** Slot-finding algorithm with holiday and weekday user preferences, and deadline feature implementation.

* **Roll No:** S20220010235
  **Name:** VASHAN ANAND CHAUDHARY
  **Contribution:** Email reminder scheduling, and event creation, deletion, and updates.

* **Roll No:** S20220010238
  **Name:** SNEHAL VATTIKONDA
  **Contribution:** Multi-user event scheduling and organizer workflow features.

* **Roll No:** S20220010242
  **Name:** VINAY CHOWDARY KAKARLA
  **Contribution:** Frontend UI/UX, full calendar view, and manual event creation.

> **Note:** If you are running this assignment from a downloaded ZIP file, please jump to the **[Quick-Start Guide](#-quick-start-guide-docker-setup)** section below for a one-click Docker setup for Windows and macOS.
  
This document outlines the core scheduling algorithms, the complete frontend and backend tech stack, and clear instructions for running this application locally with Docker.

## 🛠️ Technology Stack Overview

**Backend Infrastructure**

* **Python 3 & FastAPI:** Ultra-high-performance asynchronous web framework used for handling complex scheduling algorithms concurrently.

* **MongoDB:** A NoSQL database specifically chosen to allow flexible, rapid querying of nested event and user objects asynchronously.

* **APScheduler & smtplib:** Background job scheduling to seamlessly dispatch automated email reminders running in the background independently of the API worker threads.

* **Passlib (Bcrypt) & Python-JOSE:** Enterprise-standard security for securely hashing user passwords and managing JSON Web Tokens (JWT) for authentication.

**Frontend Interface**

* **React 19 & Vite:** A lightning-fast, modern component-based UI framework leveraging Vite for instant hot-module-reloading during development.

* **TailwindCSS / Vanilla CSS:** Used for dynamic, responsive, and aesthetically premium styling with glassmorphism effects.

* **Lucide-React:** Provides clean, consistent, minimal SVG iconography across the entire application interface.

* **Axios:** Handles promise-based HTTP integrations with the FastAPI backend, including intercepting outgoing requests to automatically inject JWT authorization headers.

## ✨ Features Overview

### Frontend (User Interface)

* **Dynamic Calendar Overlay:** Users visualize their existing events on a customized interactive calendar utilizing color-coding (Red for Public Holidays, Blue for Today).

* **Multi-Modal Forms:** Sleek, responsive popup modals to "Add Solo Event" vs "Find Overlap with Colleague".

* **Dashboard Summary:** A clean landing area showing immediate upcoming schedules at a glance.

* **Interactive Toggles:** Granular controls when canceling an event—allowing users to either cancel just their own attendance, or dispatch a cascade deletion for everyone involved.

### Backend (Algorithmic Logic)

* **The Core Sliding Window (Forward Search):** Finds a consecutive number of days where the user is free by sliding a window forward and intelligently skipping public holidays (using the `holidays` Python library) and user-defined "avoid dates".

* **Deadline Scheduling (Backward Search):** Works *backwards* from a strict deadline to find the *latest* possible $N$ consecutive free days without overlapping into blackout ranges.

* **Multi-User Intersection Engine:** Automatically computes the intersection of both User A and User B's calendars to find a mutually free slot, without requiring cumbersome back-and-forth invite approvals.

* **Robust Email Service:** Handles automated dispatching of "Event Created", "Event Updated", "Participant Canceled", and "Organizer Canceled" emails cleanly in background threads via FastAPI `BackgroundTasks`.

## 🏎️ Quick-Start Guide (Docker Setup)

To avoid issues caused by different local Python or Node versions, this project is fully Dockerized. Docker uses isolated containers with all required software preconfigured.

### Install Docker Desktop (Windows and macOS)

#### Windows (Docker Desktop)

1. Open the official Docker Desktop download page: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).
2. Click **Download for Windows (Windows 10/11)**.
3. Run the downloaded installer (`Docker Desktop Installer.exe`).
4. Keep **Use WSL 2 instead of Hyper-V** enabled (recommended).
5. Finish installation and restart your system if prompted.
6. Launch Docker Desktop and wait until it shows Docker Engine is running.
7. Verify installation in Command Prompt:

  ```cmd
  docker --version
  docker compose version
  ```

#### macOS (Docker Desktop)

1. Open the official Docker Desktop download page: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).
2. Choose the correct build:
  - **Mac with Apple chip** (M1/M2/M3).
  - **Mac with Intel chip**.
3. Open the downloaded `.dmg` file and drag **Docker** into **Applications**.
4. Open Docker from Applications and complete first-time permissions/setup.
5. Wait until Docker Desktop shows Docker Engine is running.
6. Verify installation in Terminal:

  ```bash
  docker --version
  docker compose version
  ```

> If Docker commands are not recognized, fully close and reopen the terminal after installation.

### Prerequisites

1. Ensure **Docker Desktop** is installed (using the steps above) and running in the background.

2. **Email Configuration (Required for testing automated features):**
   Before running the application, please configure the `backend/.env` file:
   - Open the `backend/.env` file.
   - For `SMTP_EMAIL`, enter your personal Gmail address. **Important:** Do NOT use your institute/university email address, as these typically block external SMTP connections.
   - For `SMTP_PASSWORD`, you must generate an "App Password". Follow these steps:
     1. Go to your Google Account settings: [Google App Passwords](https://myaccount.google.com/apppasswords).
     2. Enter an app name such as `smart_scheduler` and click **Create**.
     3. Copy the generated 16-character password and paste it into the `SMTP_PASSWORD` field in your `.env` file.

### Step-by-Step Instructions

#### For Windows Users

1. Unzip the downloaded submission folder.

> **Important (Windows ZIP behavior):** On some systems, extraction creates nested folders (for example, `Smart_Meet_Scheduler/Smart_Meet_Scheduler`). If this happens, open folders until you reach the level that contains `docker-compose.yml`, `backend`, and `frontend`. Run all Docker commands from that level only.

2. Open the project folder in **Visual Studio Code (VS Code)**.
   - Go to the top menu and select **Terminal > New Terminal**.
   *(Alternatively, you can use Command Prompt and `cd` into the folder).*

3. Make sure **Docker Desktop** is open and running in the background.

4. Build and start the containers by running this command in the terminal:

   ```cmd
   docker compose up -d --build
   ```

#### For macOS Users

1. Unzip the downloaded submission folder.

> **Important (ZIP extraction behavior):** In some systems, extraction may create nested folders (for example, `Smart_Meet_Scheduler/Smart_Meet_Scheduler`). If this happens, open folders until you reach the level that contains `docker-compose.yml`, `backend`, and `frontend`. Run all Docker commands from that level only.

2. Open the project folder in **Visual Studio Code (VS Code)**.
   - Go to the top menu and select **Terminal > New Terminal**.
   *(Alternatively, you can use the native Terminal app and `cd` into the folder).*

3. Make sure **Docker Desktop** is open and running in the background.

4. Build and start the containers by running this command in the terminal:

   ```bash
   docker compose up -d --build
   ```

> **Note:** The `-d` flag runs the server entirely in the background. The `--build` flag ensures that it compiles the absolute latest version of the code from the ZIP file instead of using a cached image.

### Accessing the Application

Once the terminal finishes and the status says `Running`:

* **Frontend Web App:** Open your browser to [http://localhost](http://localhost) (or [http://localhost:80](http://localhost:80)).

* **Backend API Docs:** Open your browser to [Smart Scheduler - Swagger UI](http://127.0.0.1:8000/docs) or [Smart Scheduler - ReDoc](http://127.0.0.1:8000/redoc).

> **Port Note:** In Docker mode, the frontend runs on port `80` and the backend runs on port `8000`.

When you are finished testing, simply shut down all containers by running:

```bash
docker compose down
```

