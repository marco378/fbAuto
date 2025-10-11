import express from 'express'
import { 
  createJob, 
  deleteJob, 
  getJob, 
  getJobAnalytics, 
  getPendingJobs, 
  getUserJobs, 
  postJobToFacebook, 
  updateJob,
  processPendingJob,
  processAllPendingJobs,
  getJobsForClientAutomation,
  updateJobPostingStatus
} from '../controllers/job.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const jobRouter = express.Router()

jobRouter.use(verifyToken)

// Basic job CRUD operations
jobRouter.post('/', createJob);
jobRouter.get('/', getUserJobs);
jobRouter.get('/pending', getPendingJobs);

// Client-side automation routes (must come before /:jobId)
jobRouter.get('/client-automation', getJobsForClientAutomation);

// NEW: Pending job processing routes
jobRouter.post('/pending/process-all', processAllPendingJobs);
jobRouter.post('/pending/:jobId/process', processPendingJob);

// Parameterized routes (must come after specific routes)
jobRouter.get('/:jobId', getJob);
jobRouter.put('/:jobId', updateJob);
jobRouter.delete('/:jobId', deleteJob);

// Job posting routes
jobRouter.post('/:jobId/post-to-facebook', postJobToFacebook);
jobRouter.get('/:jobId/analytics', getJobAnalytics);
jobRouter.post('/:jobId/update-posting-status', updateJobPostingStatus);

export default jobRouter