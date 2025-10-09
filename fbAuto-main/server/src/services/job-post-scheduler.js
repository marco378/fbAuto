// src/services/job-post-scheduler.js
import cron from 'node-cron';
import { automationService } from './automation.services.js';

class JobPostScheduler {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing job post scheduler...');
      
      // Start job posting automation every 1 minute (for testing)
      this.start('* * * * *'); // Run every minute
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

  start(schedule = '* * * * *') {
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
      const result = await automationService.processAllPendingJobs();
      
      if (result.success) {
        console.log(`✅ Job post automation completed: ${result.stats.successful}/${result.stats.total} jobs successful`);
      } else {
        console.log('⚠️ Job post automation completed with issues');
      }
    } catch (error) {
      console.error('❌ Scheduled job post automation failed:', error.message);
    } finally {
      this.isRunning = false;
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
      isRunning: this.isRunning
    };
  }

  async shutdown() {
    console.log('🧹 Shutting down job post scheduler...');
    this.stop();
    console.log('✅ Job post scheduler shutdown completed');
  }
}

export const jobPostScheduler = new JobPostScheduler();