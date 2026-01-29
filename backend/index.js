import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import graphRoutes from "./routes/graph.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/graph", graphRoutes);

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT);
