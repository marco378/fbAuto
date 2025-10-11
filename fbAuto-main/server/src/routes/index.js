import express from 'express'
import path from 'path'
import authRouter from './auth.router.js'
import facebookRouter from './facebook.router.js'
import jobRouter from './job.route.js'
import candidateRouter from './candidate.route.js'
import cookieRouter from './cookie.router.js'
import manual2FARouter from './manual-2fa.router.js'
import { automationService } from "../services/automation.services.js";
import { jobPostScheduler } from "../services/job-post-scheduler.js";


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
    const schedulerStatus = jobPostScheduler.getStatus();
    
    res.json({
      ...serviceStatus,
      systemStats,
      scheduler: schedulerStatus,
      message: "Local automation service status"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get automation status",
      message: error.message
    });
  }
});

// Enable/disable auto-scheduling
router.post("/automation/scheduler/toggle", async (req, res) => {
  try {
    const { enable } = req.body;
    
    if (enable) {
      jobPostScheduler.enableAutoScheduling();
    } else {
      jobPostScheduler.disableAutoScheduling();
    }
    
    res.json({
      success: true,
      message: `Auto-scheduling ${enable ? 'enabled' : 'disabled'}`,
      scheduler: jobPostScheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve manual 2FA control interface
router.get("/manual-2fa-control", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual 2FA Controller - fbAuto</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1877F2; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .enabled { background-color: #d4edda; color: #155724; }
        .disabled { background-color: #f8d7da; color: #721c24; }
        button { background-color: #1877F2; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin: 10px 10px 10px 0; font-size: 16px; }
        button:hover { background-color: #166fe5; }
        button.success { background-color: #28a745; }
        button.danger { background-color: #dc3545; }
        .log { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 20px 0; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Manual 2FA Controller</h1>
        <div id="status" class="status">Loading status...</div>
        <button onclick="toggleManual2FA(true)" class="success">Enable Manual 2FA Mode</button>
        <button onclick="toggleManual2FA(false)" class="danger">Disable Manual 2FA Mode</button>
        <button onclick="refreshStatus()">🔄 Refresh Status</button>
        <button onclick="runJobWithManual2FA()" class="success">Run Job Posting (Manual 2FA)</button>
        <div id="log" class="log">Ready...</div>
    </div>
    <script>
        const API_BASE = '/api/manual-2fa';
        async function refreshStatus() {
            try {
                const response = await fetch(API_BASE + '/status');
                const data = await response.json();
                document.getElementById('status').textContent = data.message;
                document.getElementById('status').className = 'status ' + (data.manual2FA ? 'enabled' : 'disabled');
            } catch (error) {
                document.getElementById('log').textContent += 'Error: ' + error.message + '\\n';
            }
        }
        async function toggleManual2FA(enable) {
            try {
                const response = await fetch(API_BASE + '/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enable })
                });
                const data = await response.json();
                document.getElementById('log').textContent += (enable ? 'Enabled' : 'Disabled') + ' manual 2FA\\n';
                refreshStatus();
            } catch (error) {
                document.getElementById('log').textContent += 'Error: ' + error.message + '\\n';
            }
        }
        async function runJobWithManual2FA() {
            try {
                document.getElementById('log').textContent += 'Starting job with manual 2FA...\\n';
                const response = await fetch(API_BASE + '/run-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                const data = await response.json();
                document.getElementById('log').textContent += 'Result: ' + data.message + '\\n';
            } catch (error) {
                document.getElementById('log').textContent += 'Error: ' + error.message + '\\n';
            }
        }
        refreshStatus();
    </script>
</body>
</html>
  `);
});

export default router