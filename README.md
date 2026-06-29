# MediLink: AI-Powered Healthcare Platform

MediLink is a modern, full-stack healthcare application designed to streamline the interaction between patients and doctors. At its core is a sophisticated AI assistant that helps users manage their healthcare needs, from answering questions about their medical documents to booking appointments.

## 🌟 AI Chat Assistant

The centerpiece of the MediLink platform is the AI-powered chat assistant. This assistant is designed to be a patient's first point of contact, providing intelligent, context-aware support.

### Core Capabilities

- **Conversational Interface:** Users can interact with the assistant using natural language.
- **Medical Document Analysis (RAG):** The assistant utilizes a Retrieval-Augmented Generation (RAG) pipeline to understand and answer questions based on user-uploaded medical documents.
  - **Supported Formats:** Users can upload PDFs and images (JPG, PNG).
  - **Advanced OCR:** The system can perform Optical Character Recognition (OCR) on images, including detecting and extracting handwritten text.
  - **Intelligent Processing:** Documents are intelligently chunked into relevant sections, and structured data (like test results and dates) is extracted and stored. This allows for highly accurate and contextually relevant answers.
- **Application Integration (Tool-Calling):** The assistant can perform actions within the MediLink application on the user's behalf. This is achieved through OpenAI's tool-calling functionality.
  - **Find Doctors:** Search for doctors by name, specialty, or location.
  - **Book Appointments:** Request appointments with specific doctors.
  - **Check Status:** View the status of pending appointment requests.

### Technology

- **Language Model:** OpenAI's `gpt-4o-mini`
- **Architecture:** The assistant is built on a robust architecture that combines RAG and tool-calling, allowing it to be both a knowledge expert and a capable agent.

## 🚀 Full-Stack Application

The AI assistant is part of a comprehensive full-stack application that provides the underlying features for patient and doctor management.

### Technology Stack

#### Backend

- **Framework:** Python 3 with [FastAPI](https://fastapi.tiangolo.com/) for building high-performance, asynchronous APIs.
- **Database:** PostgreSQL for data storage, with [SQLAlchemy](https://www.sqlalchemy.org/) as the ORM and [Alembic](https://alembic.sqlalchemy.org/) for database migrations. The application is configured to connect to Google Cloud SQL.
- **Authentication:** Secure JWT-based authentication handled by `passlib` and `python-jose`.
- **Cloud Services:**
  - **Google Cloud Storage:** For securely storing user-uploaded medical documents.
  - **Google Calendar API:** To integrate with doctors' calendars for appointment scheduling.
- **Caching:** Redis is used for caching and to support other application services.

#### Frontend

- **Framework:** [Next.js](https://nextjs.org/) 15 with React 19.
- **Language:** [TypeScript](https://www.typescriptlang.org/) for type-safe code.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4 for a modern, utility-first design system.
- **Build System:** The project leverages Next.js's high-speed [Turbopack](https://turbo.build/pack) for both development and production builds.

#### DevOps

- **CI/CD:** [Jenkins](https://www.jenkins.io/) is used for continuous integration and deployment, configured via a `Jenkinsfile`.
- **Service Management:** [Docker](https://www.docker.com/) and `docker-compose` are used to manage dependent services like Redis and Grafana.

### Getting Started

To run the MediLink platform locally, you will need to set up the backend and frontend separately.

#### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create a virtual environment and install dependencies:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```
3.  **Configure environment variables:**
    - Create a `.env` file based on the required settings in `app/core/config.py`. This will include database URLs, API keys for OpenAI and Google Cloud, and JWT secrets.
4.  **Run database migrations:**
    ```bash
    alembic upgrade head
    ```
5.  **Start the server:**
    ```bash
    uvicorn app.main:app --reload
    ```

#### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment variables:**
    - Create a `.env.local` file to store the backend API URL (e.g., `NEXT_PUBLIC_API_URL=http://localhost:8000`).
4.  **Start the development server:**
    ```bash
    npm run dev
    ```

The application should now be running, with the frontend accessible at `http://localhost:3000` and the backend at `http://localhost:8000`.
