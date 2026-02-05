import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import graphRoutes from "./routes/graph.js";

// Load environment variables from backend/.env into process.env.
dotenv.config();

// Create the Express application.
const app = express();
// Allow cross-origin requests (e.g., Vite dev server -> API).
app.use(cors());
// Parse JSON request bodies.
app.use(express.json());

// Mount graph-related routes under /api/graph.
app.use("/api/graph", graphRoutes);

// Simple health check endpoint.
app.get("/health", (_, res) => {
  res.json({ ok: true });
});

// Use PORT from env if provided, otherwise default to 3001.
const PORT = process.env.PORT || 3001;
// Start the server.
app.listen(PORT);
