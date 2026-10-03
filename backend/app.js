const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./routes/auth");
const projectsRouter = require("./routes/projects");
const tasksRouter = require("./routes/tasks");
const usersRouter = require("./routes/users");
const emailsRouter = require("./routes/emails");

const app = express();
const url = process.env.MONGODB_URI;
console.log("url", url);

mongoose
  .connect(url)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const clientOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
]
  .filter(Boolean)
  .map((o) => o.replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || clientOrigins.includes(origin.replace(/\/$/, ""))) {
        return cb(null, true);
      }
      return cb(null, true); // allow all in dev
    },
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/emails", emailsRouter);

const port = process.env.PORT || 4000;

if (!process.env.VERCEL && require.main === module) {
  app.listen(port, () => {
    console.log(`FlowDesk API on http://localhost:${port}`);
    console.log(`Health: http://localhost:${port}/health`);
  });
}

module.exports = app;
