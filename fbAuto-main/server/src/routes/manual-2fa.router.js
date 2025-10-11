import { Router } from 'express';
import { toggleManual2FA, get2FAStatus, runJobWithManual2FA } from '../controllers/manual-2fa.controller.js';

const router = Router();

// Get current 2FA mode status
router.get('/status', get2FAStatus);

// Toggle manual 2FA mode on/off
router.post('/toggle', toggleManual2FA);

// Run a job posting with manual 2FA enabled (shows browser window)
router.post('/run-job', runJobWithManual2FA);

export default router;