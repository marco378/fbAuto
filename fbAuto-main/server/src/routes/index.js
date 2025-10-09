import express from 'express'
import authRouter from './auth.router.js'
import facebookRouter from './facebook.router.js'
import jobRouter from './job.route.js'
import candidateRouter from './candidate.route.js'
import cookieRouter from './cookie.router.js'
import n8nRouter from './n8n.route.js'
import { automationService } from "../services/automation.services.js";
import { prisma } from "../lib/prisma.js";


const router = express.Router()

router.use("/auth", authRouter)
router.use("/facebook", facebookRouter)
router.use("/jobs", jobRouter)
router.use("/candidates", candidateRouter)
router.use("/cookies",cookieRouter)
router.use("/n8n", n8nRouter)

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

// Debug endpoint to check pending jobs
router.get("/debug/jobs", async (req, res) => {
  try {
    // Get all jobs to debug
    const allJobs = await prisma.job.findMany({
      include: {
        posts: true,
        user: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get pending jobs using the same query as automation
    const pendingJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        facebookGroups: {
          isEmpty: false
        },
        posts: {
          none: { status: "SUCCESS" }
        }
      },
      include: {
        posts: true,
        user: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    res.json({
      totalJobs: allJobs.length,
      pendingJobs: pendingJobs.length,
      allJobs: allJobs.map(job => ({
        id: job.id,
        title: job.title,
        isActive: job.isActive,
        facebookGroups: job.facebookGroups,
        postsCount: job.posts.length,
        successfulPosts: job.posts.filter(p => p.status === 'SUCCESS').length,
        posts: job.posts.map(p => ({ id: p.id, status: p.status }))
      })),
      pendingJobs: pendingJobs.map(job => ({
        id: job.id,
        title: job.title,
        isActive: job.isActive,
        facebookGroups: job.facebookGroups,
        postsCount: job.posts.length
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to debug jobs",
      message: error.message
    });
  }
});

export default router