import express from 'express';
import { runJobPostAutomation } from './job-post-trigger.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Endpoint to trigger the Playwright job post automation
app.post('/api/trigger-job-post', async (req, res) => {
  try {
    const jobData = req.body;
    const result = await runJobPostAutomation(jobData);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`fbAutoScript server running on port ${PORT}`);
});
