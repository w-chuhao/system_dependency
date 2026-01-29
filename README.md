# System Dependency Viewer

Small full-stack app that lets you pick a failed system and see which downstream systems are impacted. The frontend is a Vite + React app and the backend is an Express API backed by Neo4j.

## Features
- Dropdown of available systems from Neo4j
- List of affected systems for the selected outage
- Simple JSON API for system graph queries

## Tech stack
- Frontend: Vite, React
- Backend: Express, Neo4j Driver
- Database: Neo4j (Aura or self-hosted)

## Project structure
```
backend/   Express API + Neo4j queries
frontend/  Vite + React UI
```

## Prerequisites
- Node.js 18+ (recommended)
- A Neo4j database with `System` nodes and `DEPENDS_ON` relationships

Expected graph model:
- Nodes: `(:System { systemId: "SVC-123" })`
- Relationships: `(A:System)-[:DEPENDS_ON]->(B:System)`

## Setup

### 1) Backend
Create `backend/.env` with your Neo4j connection details:
```
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
PORT=3001
```

Install and start:
```
cd backend
npm install
npm run start
```

### 2) Frontend
Install and start:
```
cd frontend
npm install
npm run dev
```

Open the app at the Vite dev URL (typically `http://localhost:5173`).

## API
Base URL: `http://localhost:3001`

- `GET /health`  
  Health check.

- `GET /api/graph/systems`  
  Returns all system IDs for the dropdown.

- `GET /api/graph/affected/:systemId`  
  Returns systems that (directly or indirectly) depend on the failed system.

- `GET /api/graph/downstream/:systemId`  
  Returns a node/edge list representing downstream dependencies (depth 1..5).

## Notes
- Frontend requests are hardcoded to `http://localhost:3001`. Change the URLs in `frontend/src/main.jsx` if your API runs elsewhere.
- The dependency depth is capped at 5 hops in the API queries. Adjust the Cypher in `backend/routes/graph.js` if needed.

## Development tips
- If you update the Neo4j schema or sample data, restart the backend to pick up changes.
- For CORS issues, make sure the backend is running and accessible at the URL used in the frontend.
