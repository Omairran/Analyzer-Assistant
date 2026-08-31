# 🚀 AI Requirement Analyzer

An intelligent, full-stack web application designed for automated Software Requirement Specification (SRS) and Requirements Document Analysis. Upload requirement documents (PDF, DOCX, TXT), extract functional and non-functional requirements with Google Gemini AI, generate database schemas, extract REST API specifications, design Mermaid sequence diagrams, and export analysis reports.

---

## ✨ Features

- 📄 **Multi-Format Document Parsing**: Supports raw text extraction from `.pdf`, `.docx`, and `.txt` files.
- 🤖 **Automated Requirement Analysis**: Powered by Google Gemini (`gemini-2.5-flash`) to generate concise executive summaries, acceptance criteria, and missing requirement / edge-case flags.
- 🗄️ **Database Schema Generator**: Automatically generates entity tables and columns based on document requirements.
- 🔌 **REST API Specification Extractor**: Identifies required backend endpoints, HTTP methods, and descriptions.
- 📋 **Development Task Breakdown**: Generates actionable development tasks with complexity ratings (`Low`, `Medium`, `High`).
- 📊 **Mermaid Sequence Diagramming**: Auto-generates interactive UML sequence diagrams visualizing request/response flows.
- 📑 **PDF & JSON Export**: Export analysis dashboards directly into formatted PDF reports (via `jspdf` & `jspdf-autotable`) or raw JSON files.
- 💾 **MongoDB Atlas Storage & History**: Retain and manage past document analyses with full search, rename, and delete support.
- 🔒 **User Authentication & Role Management**: Multi-role support (`Analyst`, `Architect`, `Admin`) with token header authorization.

---

## 🛠️ System Architecture

```
                                +---------------------------+
                                |    React 19 + Vite UI     |
                                |  (Results, Upload, Auth)  |
                                +-------------+-------------+
                                              |
                                     HTTP / REST API (CORS)
                                              |
                                +-------------v-------------+
                                |     FastAPI Microservice  |
                                |       (Python 3.10+)      |
                                +------+--------------+------+
                                       |              |
                    +------------------v--+        +--v------------------+
                    |  Google Gemini AI   |        |    MongoDB Atlas    |
                    | (Requirement Model) |        |  (Document History) |
                    +---------------------+        +---------------------+
```

---

## 📂 Project Structure

```
Analyzer Assistant/
├── backend/
│   ├── ai_service.py       # Gemini API client & requirement extraction prompts
│   ├── database.py         # MongoDB Atlas persistence layer
│   ├── main.py             # FastAPI REST endpoints & CORS configuration
│   ├── parser.py           # PyPDF, python-docx & text document parser
│   └── requirements.txt    # Python backend dependencies
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx        # Login & role-management modal
│   │   ├── HistoryDashboard.jsx # Saved analysis history viewer
│   │   ├── ResultsDashboard.jsx # Tabbed AI breakdown & Mermaid diagrams
│   │   └── UploadSection.jsx    # File drag-and-drop & parsing status
│   ├── utils/
│   │   └── exportHelpers.js     # PDF & JSON report generation helpers
│   ├── App.jsx             # Main application layout & global state
│   ├── index.css           # Glassmorphic UI styling
│   └── main.jsx            # React root mount point
├── public/                 # Static web assets
├── package.json            # Frontend dependencies & scripts
├── vite.config.js          # Vite build tool configuration
└── README.md               # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Gemini API Key** ([Get free key from Google AI Studio](https://aistudio.google.com/))

---

### 1. Backend Setup (FastAPI)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file inside `backend/`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string_here
   ```

5. Start the FastAPI development server:
   ```bash
   python main.py
   # Or using uvicorn directly:
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be running at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal in the root project directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `GET /` | `GET` | Server health check and API metadata. |
| `POST /api/upload` | `POST` | Upload document (`.pdf`, `.docx`, `.txt`), parse text, and run AI analysis. |
| `POST /api/save` | `POST` | Save completed analysis record into MongoDB Atlas. |
| `GET /api/history` | `GET` | Retrieve list of past saved requirement analyses. |
| `DELETE /api/history/{id}` | `DELETE` | Remove a record from MongoDB by ID. |
| `PUT /api/history/{id}/rename` | `PUT` | Update filename of a saved record. |

---

## 🧪 Testing

Run backend integration tests:
```bash
cd backend
python test_backend.py
```

---

## 📜 License

This project is licensed under the MIT License.
