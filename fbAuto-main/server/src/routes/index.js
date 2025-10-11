import express from 'express'
import path from 'path'
import authRouter from './auth.router.js'
import facebookRouter from './facebook.router.js'
import jobRouter from './job.route.js'
import candidateRouter from './candidate.route.js'
import cookieRouter from './cookie.router.js'
import manual2FARouter from './manual-2fa.router.js'
import { automationService } from "../services/automation.services.js";


const router = express.Router()

router.use("/auth", authRouter)
router.use("/facebook", facebookRouter)
router.use("/jobs", jobRouter)
router.use("/candidates", candidateRouter)
router.use("/cookies",cookieRouter)
router.use("/manual-2fa", manual2FARouter)

router.get("/automation/status", async (req, res) => {
  try {
    const serviceStatus = automationService.getServiceStatus();
    const systemStats = await automationService.getSystemStats();
    
    res.json({
      ...serviceStatus,
      systemStats,
      message: "Local automation service status"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get automation status",
      message: error.message
    });
  }
});

// Serve manual 2FA control interface
router.get("/manual-2fa-control", (req, res) => {
  res.sendFile(path.join(process.cwd(), 'server/public/manual-2fa.html'));
});

export default router