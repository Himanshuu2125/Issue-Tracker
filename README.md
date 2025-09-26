# Issue Tracker

A simple issue tracker application with a Next.js frontend and a FastAPI backend.

## Features

- Create, Read, Update issues.
- Filter issues by status, priority, and assignee.
- Sort issues by different fields.
- Pagination for the issues list.
- Dark mode support.

## Tech Stack

**Frontend:**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend:**
- Python
- FastAPI
- Pydantic

## Getting Started

### Prerequisites

- Node.js and npm (or yarn)
- Python 3.8+ and pip

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Issue-Tracker
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../server
   pip install -r requirements.txt
   ```

### Running the application

1. **Run the backend server:**
   ```bash
   cd server
   uvicorn main:app --reload
   ```
   The backend server will be running at `http://127.0.0.1:8000`.

2. **Run the frontend development server:**
   ```bash
   cd client
   npm run dev
   ```
   The frontend application will be available at `http://localhost:3000`.

## API Endpoints

The backend API provides the following endpoints:

- `GET /api/health`: Health check.
- `GET /api/issues`: Get a list of issues with filtering, sorting, and pagination.
- `GET /api/issues/{issue_id}`: Get a single issue by ID.
- `POST /api/issues`: Create a new issue.
- `PUT /api/issues/{issue_id}`: Update an existing issue.

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file defines the build and routing configuration for both the frontend and backend.
