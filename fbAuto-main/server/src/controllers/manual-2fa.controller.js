import { automationService } from "../services/automation.services.js";

// Toggle manual 2FA mode
export const toggleManual2FA = async (req, res) => {
  try {
    const { enable } = req.body;
    
    if (enable) {
      process.env.MANUAL_2FA = 'true';
      process.env.HEADLESS = 'false';
      console.log("🖥️ Manual 2FA mode ENABLED - Browser will show window for manual completion");
    } else {
      process.env.MANUAL_2FA = 'false';
      process.env.HEADLESS = 'true';
      console.log("🤖 Manual 2FA mode DISABLED - Browser will run headless");
    }
    
    res.json({
      success: true,
      message: `Manual 2FA mode ${enable ? 'enabled' : 'disabled'}`,
      manual2FA: enable,
      headless: !enable
    });
  } catch (error) {
    console.error("❌ Error toggling manual 2FA:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current 2FA mode status
export const get2FAStatus = async (req, res) => {
  try {
    const manual2FA = process.env.MANUAL_2FA === 'true';
    const headless = process.env.HEADLESS !== 'false';
    
    res.json({
      success: true,
      manual2FA,
      headless,
      nodeEnv: process.env.NODE_ENV,
      message: manual2FA ? 
        "Manual 2FA mode is ENABLED - Browser windows will be visible" : 
        "Manual 2FA mode is DISABLED - Browser runs headless"
    });
  } catch (error) {
    console.error("❌ Error getting 2FA status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Trigger a job post with manual 2FA enabled
export const runJobWithManual2FA = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    // Enable manual 2FA for this run
    const previousManual2FA = process.env.MANUAL_2FA;
    const previousHeadless = process.env.HEADLESS;
    
    process.env.MANUAL_2FA = 'true';
    process.env.HEADLESS = 'false';
    
    console.log("🖥️ Starting job posting with manual 2FA mode enabled");
    console.log("🔧 Browser window will be visible for manual 2FA completion");
    
    // Use the automation service with a default user ID (you may want to get this from auth)
    const defaultUserId = "cmgm1fmmm0000pp01qr9am19b"; // Replace with actual user ID logic
    
    const result = await automationService.runJobPostAutomationForUser(defaultUserId, jobId);
    
    // Restore previous settings
    process.env.MANUAL_2FA = previousManual2FA;
    process.env.HEADLESS = previousHeadless;
    
    res.json({
      success: true,
      message: "Job posting completed with manual 2FA",
      result
    });
    
  } catch (error) {
    console.error("❌ Error running job with manual 2FA:", error);
    
    // Restore previous settings on error
    process.env.MANUAL_2FA = process.env.MANUAL_2FA || 'false';
    process.env.HEADLESS = process.env.HEADLESS || 'true';
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};