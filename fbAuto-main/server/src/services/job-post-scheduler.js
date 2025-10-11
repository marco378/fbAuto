// src/services/job-post-scheduler.js
import cron from 'node-cron';
import { automationService } from './automation.services.js';
import { prisma } from '../lib/prisma.js';

class JobPostScheduler {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.autoSchedulingEnabled = true; // Can be disabled when no jobs exist
  }

  async initialize() {
    try {
      console.log('🔄 Initializing job post scheduler...');
      
      // Start job posting automation every 5 minutes (less aggressive)
      this.start('*/5 * * * *'); // Run every 5 minutes instead of every minute
      console.log('✅ Job post scheduler initialized successfully');
      
      // Run once after 30 seconds of server start (to allow everything to initialize)
      setTimeout(async () => {
        if (!this.isRunning) {
          console.log('🚀 Running initial job post processing...');
          await this.processAllJobs();
        }
      }, 30000); // 30 seconds delay
      
    } catch (error) {
      console.error('❌ Failed to initialize job post scheduler:', error.message);
    }
  }

  start(schedule = '*/5 * * * *') { // Default to every 5 minutes
    if (this.cronJob) {
      console.log('⚠️ Job post scheduler already running');
      return;
    }

    console.log(`🚀 Starting job post automation scheduler: ${schedule}`);

    this.cronJob = cron.schedule(schedule, async () => {
      if (this.isRunning) {
        console.log('⏳ Previous job processing still running, skipping...');
        return;
      }

      if (!this.autoSchedulingEnabled) {
        console.log('💤 Auto-scheduling disabled, skipping...');
        return;
      }

      await this.processAllJobs();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata" // Adjust to your timezone
    });

    this.cronJob.start();
  }

  async processAllJobs() {
    this.isRunning = true;
    try {
      console.log('🔄 Running scheduled job post automation...');
      
      // Quick check for pending jobs before processing
      const hasJobs = await this.hasPendingJobs();
      if (!hasJobs) {
        console.log('💤 No pending jobs found, skipping automation...');
        return { success: true, message: 'No pending jobs found' };
      }
      
      const result = await automationService.processAllPendingJobs();
      
      if (result.success) {
        if (result.stats) {
          console.log(`✅ Job post automation completed: ${result.stats.successful}/${result.stats.total} jobs successful`);
        } else {
          console.log(`✅ Job post automation completed: ${result.message}`);
        }
      } else {
        console.log('⚠️ Job post automation completed with issues');
      }
    } catch (error) {
      console.error('❌ Scheduled job post automation failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  async hasPendingJobs() {
    try {
      const count = await prisma.job.count({
        where: {
          isActive: true,
          facebookGroups: {
            isEmpty: false
          },
          posts: {
            none: { status: "SUCCESS" }
          }
        }
      });
      return count > 0;
    } catch (error) {
      console.error('❌ Error checking for pending jobs:', error.message);
      return false; // Assume no jobs if error occurs
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Job post scheduler stopped');
    }
  }

  getStatus() {
    return {
      isScheduled: !!this.cronJob,
      isRunning: this.isRunning,
      autoSchedulingEnabled: this.autoSchedulingEnabled
    };
  }

  enableAutoScheduling() {
    this.autoSchedulingEnabled = true;
    console.log('✅ Auto-scheduling enabled');
  }

  disableAutoScheduling() {
    this.autoSchedulingEnabled = false;
    console.log('💤 Auto-scheduling disabled');
  }

  async shutdown() {
    console.log('🧹 Shutting down job post scheduler...');
    this.stop();
    console.log('✅ Job post scheduler shutdown completed');
  }
}

export const jobPostScheduler = new JobPostScheduler();