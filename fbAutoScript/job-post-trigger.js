// This file will import and call your Playwright automation from fbAuto-main
import path from 'path';
import { fileURLToPath } from 'url';

// Dynamically import the job-post-runner.js from your main project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jobPostRunnerPath = path.resolve(__dirname, '../fbAuto-main/src/automation/job-post-runner.js');

export async function runJobPostAutomation(jobData) {
  // Import the job-post-runner.js module
  const jobPostRunner = await import(jobPostRunnerPath);
  // You may need to adjust the function name below to match your actual export
  if (typeof jobPostRunner.runJobPost === 'function') {
    return await jobPostRunner.runJobPost(jobData);
  } else if (typeof jobPostRunner.default === 'function') {
    return await jobPostRunner.default(jobData);
  } else {
    throw new Error('No valid job post function found in job-post-runner.js');
  }
}
