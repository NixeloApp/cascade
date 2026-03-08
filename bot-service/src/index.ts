import { config } from "dotenv";
import express from "express";
import { MeetingBotManager } from "./bot/manager.js";
import { authMiddleware } from "./middleware/auth.js";

config();

const app = express();
const port = process.env.PORT || 3001;

const getSingleRouteParam = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Bot manager instance
const botManager = new MeetingBotManager();

// Create a new bot job
app.post("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const { jobId, recordingId, meetingUrl, platform, botName, callbackUrl } = req.body;

    if (!(meetingUrl && recordingId)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const job = await botManager.createJob({
      jobId,
      recordingId,
      meetingUrl,
      platform: platform || "google_meet",
      botName: botName || "Nixelo Notetaker",
      callbackUrl,
    });

    res.json({ success: true, jobId: job.id });
  } catch (_error) {
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Get job status
app.get("/api/jobs/:jobId", authMiddleware, async (req, res) => {
  const jobId = getSingleRouteParam(req.params.jobId);
  if (!jobId) {
    return res.status(400).json({ error: "Missing job ID" });
  }

  try {
    const job = botManager.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (_error) {
    res.status(500).json({ error: "Failed to get job" });
  }
});

// Stop a job
app.post("/api/jobs/:jobId/stop", authMiddleware, async (req, res) => {
  const jobId = getSingleRouteParam(req.params.jobId);
  if (!jobId) {
    return res.status(400).json({ error: "Missing job ID" });
  }

  try {
    await botManager.stopJob(jobId);
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to stop job" });
  }
});

// List all active jobs
app.get("/api/jobs", authMiddleware, async (_req, res) => {
  try {
    const jobs = botManager.listJobs();
    res.json({ jobs });
  } catch (_error) {
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// Webhook for bot to report status updates (called internally)
app.post("/api/internal/status", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.BOT_SERVICE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { jobId, status, data } = req.body;
    await botManager.handleStatusUpdate(jobId, status, data);
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to handle status update" });
  }
});

const server = app.listen(port);

// Graceful shutdown
const shutdown = async (_signal: string) => {
  // Stop accepting new connections
  server.close();

  // Stop all active bots
  try {
    await botManager.stopAllJobs();
  } catch (_error) {
    // Swallow errors during shutdown - we're exiting anyway
  }

  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
