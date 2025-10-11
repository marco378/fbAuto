/**
 * FB Auto - Silent Job Posting Automation
 * 
 * This version posts jobs automatically without any user confirmations.
 * Perfect for fully automated posting when you create jobs.
 */

(function() {
  'use strict';

  // Prevent multiple instances
  if (window.fbAutoSilentRunning) {
    console.log('🔄 FB Auto Silent is already running');
    return;
  }
  window.fbAutoSilentRunning = true;

  // Configuration for silent operation
  const CONFIG = {
    apiBaseUrl: 'https://fbauto-production-4368.up.railway.app/api',
    authToken: localStorage.getItem('fb_auto_token'),
    delayBetweenPosts: 10000, // 10 seconds between posts (safer for silent mode)
    delayAfterPost: 5000, // Wait 5s after posting
    maxRetries: 3,
    debug: false, // Reduced logging for silent mode
    pollInterval: 30000, // Check for new jobs every 30 seconds
    silentMode: true, // No user confirmations
    autoStart: true, // Start immediately
  };

  // Minimal logging for silent mode
  const log = (message, type = 'info') => {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅ Silent' : '🔄 Silent';
    console.log(`${prefix} [${timestamp}] ${message}`);
  };

  // Silent notification system (no visual popups)
  const updateStatus = (message) => {
    document.title = `FB Auto: ${message}`;
    log(message);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Enhanced API calls
  const apiCall = async (endpoint, options = {}) => {
    if (!CONFIG.authToken) {
      // In silent mode, we need the token to be pre-configured
      throw new Error('Auth token required for silent mode. Please run the interactive version first to set your token.');
    }

    const url = `${CONFIG.apiBaseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('fb_auto_token');
          CONFIG.authToken = null;
          throw new Error('Authentication failed. Token expired.');
        }
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      log(`API call failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const fetchPendingJobs = async () => {
    const data = await apiCall('/jobs/client-automation');
    return data.jobs || [];
  };

  const updateJobStatus = async (jobId, groupName, status, postUrl = null, error = null) => {
    await apiCall(`/jobs/${jobId}/update-posting-status`, {
      method: 'POST',
      body: JSON.stringify({
        facebookGroup: groupName,
        status,
        postUrl,
        error
      })
    });
  };

  // Enhanced Facebook DOM detection
  const findPostComposer = () => {
    const selectors = [
      '[data-testid="status-attachment-mentions-input"]',
      '[role="textbox"][data-testid]',
      '[contenteditable="true"][role="textbox"]',
      'textarea[data-testid="react-composer-input"]',
      'div[data-testid="react-composer-root"] [contenteditable="true"]',
      '[data-testid="group-composer-input"]',
      '[contenteditable="true"]',
      'textarea[placeholder*="mind"]',
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && isVisible(element)) {
        return element;
      }
    }
    return null;
  };

  const findPostButton = () => {
    const selectors = [
      '[data-testid="react-composer-post-button"]',
      '[aria-label="Post"]',
      'div[role="button"][tabindex="0"]',
      '[data-testid="post-button"]',
      'button[type="submit"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.toLowerCase();
        if (text.includes('post') && isVisible(element) && !element.disabled) {
          return element;
        }
      }
    }
    return null;
  };

  const isVisible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  };

  // Enhanced job post formatting
  const formatJobPost = (job) => {
    const lines = [];
    
    lines.push(`🔥 ${job.title}`);
    lines.push(`🏢 ${job.company}`);
    lines.push('');
    lines.push(`📍 Location: ${job.location}`);
    lines.push(`💼 Job Type: ${job.jobType}`);
    
    if (job.salaryRange) {
      lines.push(`💰 Salary: ${job.salaryRange}`);
    }
    
    lines.push('');
    lines.push('📝 Description:');
    lines.push(job.description.trim());
    
    if (job.requirements && job.requirements.length > 0) {
      lines.push('');
      lines.push('✅ Requirements:');
      job.requirements.forEach(req => {
        if (req.trim()) lines.push(`• ${req.trim()}`);
      });
    }
    
    if (job.responsibilities && job.responsibilities.length > 0) {
      lines.push('');
      lines.push('🎯 Key Responsibilities:');
      job.responsibilities.forEach(resp => {
        if (resp.trim()) lines.push(`• ${resp.trim()}`);
      });
    }
    
    if (job.perks && job.perks.trim()) {
      lines.push('');
      lines.push(`🎁 What we offer: ${job.perks.trim()}`);
    }
    
    lines.push('');
    lines.push('💬 Interested? Comment below or send me a message!');
    lines.push('');
    lines.push('#hiring #jobs #career #opportunity');
    
    return lines.join('\n');
  };

  // Silent posting function (no confirmations)
  const postToGroupSilent = async (job, groupName) => {
    try {
      updateStatus(`Posting "${job.title}" to ${groupName}...`);
      
      if (!window.location.hostname.includes('facebook.com')) {
        throw new Error('Please navigate to Facebook.com first');
      }

      await sleep(2000);
      
      let composer = findPostComposer();
      
      if (!composer) {
        // Try clicking "What's on your mind?" to open composer
        const mindPrompts = document.querySelectorAll('[data-testid="status-attachment-mentions-input"], [placeholder*="mind"]');
        for (const prompt of mindPrompts) {
          if (isVisible(prompt)) {
            prompt.click();
            await sleep(3000);
            composer = findPostComposer();
            if (composer) break;
          }
        }
      }
      
      if (!composer) {
        throw new Error('Cannot find post composer on this page');
      }

      const postContent = formatJobPost(job);
      
      // Focus and clear the composer
      composer.focus();
      await sleep(1000);
      
      if (composer.tagName === 'TEXTAREA') {
        composer.value = '';
        await sleep(500);
        composer.value = postContent;
        composer.dispatchEvent(new Event('input', { bubbles: true }));
        composer.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        composer.textContent = '';
        await sleep(500);
        composer.innerHTML = postContent.replace(/\n/g, '<br>');
        composer.dispatchEvent(new Event('input', { bubbles: true }));
        composer.dispatchEvent(new Event('paste', { bubbles: true }));
      }

      // Wait for Facebook to process the content
      await sleep(4000);

      // Find and click post button automatically (no confirmation)
      const postButton = findPostButton();
      if (!postButton) {
        throw new Error('Cannot find Post button');
      }

      log(`Auto-posting "${job.title}" to ${groupName}`);
      postButton.click();
      
      // Wait for post to complete
      await sleep(CONFIG.delayAfterPost);
      
      const currentUrl = window.location.href;
      log(`Successfully posted to ${groupName}`, 'success');
      
      return { 
        success: true, 
        url: currentUrl,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      log(`Failed to post to ${groupName}: ${error.message}`, 'error');
      return { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  // Process jobs silently
  const processJobsSilent = async (jobs) => {
    const stats = {
      totalJobs: jobs.length,
      totalPosts: jobs.reduce((acc, job) => acc + job.pendingGroups.length, 0),
      completedJobs: 0,
      successfulPosts: 0,
      failedPosts: 0,
      skippedPosts: 0
    };

    updateStatus(`Processing ${stats.totalJobs} jobs (${stats.totalPosts} posts) silently...`);

    for (let jobIndex = 0; jobIndex < jobs.length; jobIndex++) {
      const job = jobs[jobIndex];
      
      updateStatus(`Job ${jobIndex + 1}/${stats.totalJobs}: ${job.title}`);
      
      for (let groupIndex = 0; groupIndex < job.pendingGroups.length; groupIndex++) {
        const groupName = job.pendingGroups[groupIndex];
        
        const result = await postToGroupSilent(job, groupName);
        
        // Update status via API
        try {
          const statusToUpdate = result.success ? 'SUCCESS' : 'FAILED';
          await updateJobStatus(job.id, groupName, statusToUpdate, result.url, result.error);
          
          if (result.success) {
            stats.successfulPosts++;
          } else {
            stats.failedPosts++;
          }
          
        } catch (apiError) {
          log(`Failed to update status for ${groupName}: ${apiError.message}`, 'error');
          stats.skippedPosts++;
        }

        // Delay between posts
        const isLastPost = (jobIndex === jobs.length - 1) && (groupIndex === job.pendingGroups.length - 1);
        if (!isLastPost) {
          updateStatus(`Waiting ${CONFIG.delayBetweenPosts/1000}s before next post...`);
          await sleep(CONFIG.delayBetweenPosts);
        }
      }
      
      stats.completedJobs++;
    }

    return stats;
  };

  // Continuous monitoring function
  const startContinuousMonitoring = async () => {
    log('Starting continuous job monitoring...');
    
    while (window.fbAutoSilentRunning) {
      try {
        updateStatus('Checking for new jobs...');
        const jobs = await fetchPendingJobs();

        if (jobs && jobs.length > 0) {
          const totalGroups = jobs.reduce((acc, job) => acc + job.pendingGroups.length, 0);
          log(`Found ${jobs.length} jobs with ${totalGroups} pending posts - starting silent automation`);
          
          const results = await processJobsSilent(jobs);
          
          const successRate = results.totalPosts > 0 ? 
            ((results.successfulPosts / results.totalPosts) * 100).toFixed(1) : 0;
            
          log(`Automation cycle complete: ${results.successfulPosts}/${results.totalPosts} successful (${successRate}%)`);
          updateStatus(`Cycle complete: ${results.successfulPosts}/${results.totalPosts} posted`);
        } else {
          updateStatus('No pending jobs - monitoring...');
        }
        
        // Wait before next check
        await sleep(CONFIG.pollInterval);
        
      } catch (error) {
        log(`Monitoring error: ${error.message}`, 'error');
        updateStatus(`Error: ${error.message} - retrying in ${CONFIG.pollInterval/1000}s`);
        await sleep(CONFIG.pollInterval);
      }
    }
  };

  // Main silent automation controller
  const runSilentAutomation = async () => {
    try {
      log('FB Auto Silent Mode starting...');
      updateStatus('Silent automation starting...');

      if (!CONFIG.authToken) {
        const errorMsg = 'No auth token found. Please run the interactive version first to set up authentication.';
        updateStatus(errorMsg);
        log(errorMsg, 'error');
        return;
      }

      // Verify we're on Facebook
      if (!window.location.hostname.includes('facebook.com')) {
        const errorMsg = 'Please navigate to Facebook.com to start silent automation';
        updateStatus(errorMsg);
        log(errorMsg, 'error');
        return;
      }

      updateStatus('Authentication verified - starting monitoring...');
      
      // Start continuous monitoring
      await startContinuousMonitoring();

    } catch (error) {
      const errorMsg = `Silent automation failed: ${error.message}`;
      log(errorMsg, 'error');
      updateStatus(errorMsg);
    } finally {
      window.fbAutoSilentRunning = false;
    }
  };

  // Add stop function to window for manual control
  window.stopFBAutoSilent = () => {
    window.fbAutoSilentRunning = false;
    updateStatus('Silent automation stopped by user');
    log('Silent automation stopped manually');
  };

  // Initialize silent automation
  updateStatus('FB Auto Silent Mode loaded');
  log('Facebook Job Automation Silent Mode v1.0 loaded');
  
  // Start after a brief delay
  setTimeout(runSilentAutomation, 2000);

})();