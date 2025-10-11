/**
 * Facebook Job Automation Script Loader
 * 
 * This script can be injected into any Facebook page to start automation.
 * Usage: Run in browser console or inject via bookmarklet
 */

(function() {
  'use strict';

  // Prevent multiple instances
  if (window.fbAutoRunning) {
    alert('FB Auto is already running!');
    return;
  }
  window.fbAutoRunning = true;

  // Configuration
  const CONFIG = {
    apiBaseUrl: 'https://fbauto-production-4368.up.railway.app/api',
    authToken: localStorage.getItem('fb_auto_token'),
    delayBetweenPosts: 8000, // 8 seconds between posts (safer)
    delayAfterPost: 3000, // Wait 3s after posting
    maxRetries: 3,
    debug: true,
  };

  // Enhanced logging with timestamps
  const log = (message, type = 'info') => {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    const logMessage = `${prefix} [${timestamp}] FB Auto: ${message}`;
    console.log(logMessage);
    
    // Also show in page if debug mode
    if (CONFIG.debug) {
      showNotification(message, type);
    }
  };

  // Create floating notification system
  const createNotificationSystem = () => {
    if (document.getElementById('fb-auto-notifications')) return;
    
    const container = document.createElement('div');
    container.id = 'fb-auto-notifications';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      max-width: 350px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    document.body.appendChild(container);
    return container;
  };

  const showNotification = (message, type = 'info', duration = 5000) => {
    const container = createNotificationSystem();
    
    const notification = document.createElement('div');
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336'
    };
    
    notification.style.cssText = `
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
    `;
    
    notification.textContent = message;
    notification.onclick = () => notification.remove();
    
    container.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
    
    // Add CSS animations if not already added
    if (!document.getElementById('fb-auto-styles')) {
      const style = document.createElement('style');
      style.id = 'fb-auto-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Enhanced utility functions
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const waitForElement = async (selector, timeout = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await sleep(100);
    }
    throw new Error(`Element not found: ${selector}`);
  };

  // Enhanced API calls with better error handling
  const apiCall = async (endpoint, options = {}) => {
    if (!CONFIG.authToken) {
      const token = prompt('Please enter your FB Auto authentication token:');
      if (!token) throw new Error('Authentication token required');
      CONFIG.authToken = token;
      localStorage.setItem('fb_auto_token', token);
    }

    const url = `${CONFIG.apiBaseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
      ...options.headers
    };

    log(`Making API call to ${endpoint}`);
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('fb_auto_token');
          CONFIG.authToken = null;
          throw new Error('Authentication failed. Token expired or invalid.');
        }
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      log(`API call successful: ${endpoint}`);
      return data;
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
  const detectFacebookInterface = () => {
    const url = window.location.href;
    if (url.includes('groups/')) return 'group';
    if (url.includes('profile.php') || url.includes('/profile/')) return 'profile';
    if (url.includes('pages/')) return 'page';
    return 'feed';
  };

  const findPostComposer = () => {
    const selectors = [
      // New Facebook interface
      '[data-testid="status-attachment-mentions-input"]',
      '[role="textbox"][data-testid]',
      '[contenteditable="true"][role="textbox"]',
      
      // Classic Facebook interface
      'textarea[data-testid="react-composer-input"]',
      'div[data-testid="react-composer-root"] [contenteditable="true"]',
      
      // Group posting
      '[data-testid="group-composer-input"]',
      
      // Fallbacks
      '[contenteditable="true"]',
      'textarea[placeholder*="mind"]',
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && isVisible(element)) {
        log(`Found composer using selector: ${selector}`);
        return element;
      }
    }
    
    log('No composer found with standard selectors', 'warning');
    return null;
  };

  const findPostButton = () => {
    const selectors = [
      '[data-testid="react-composer-post-button"]',
      '[aria-label="Post"]',
      'div[role="button"][tabindex="0"]:has-text("Post")',
      '[data-testid="post-button"]',
      'button[type="submit"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.toLowerCase();
        if (text.includes('post') && isVisible(element) && !element.disabled) {
          log(`Found post button using selector: ${selector}`);
          return element;
        }
      }
    }
    
    log('No post button found', 'warning');
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
    
    // Title and company with emoji
    lines.push(`🔥 ${job.title}`);
    lines.push(`🏢 ${job.company}`);
    lines.push('');
    
    // Basic info
    lines.push(`📍 Location: ${job.location}`);
    lines.push(`💼 Job Type: ${job.jobType}`);
    
    if (job.salaryRange) {
      lines.push(`💰 Salary: ${job.salaryRange}`);
    }
    
    lines.push('');
    lines.push('📝 Description:');
    lines.push(job.description.trim());
    
    // Requirements
    if (job.requirements && job.requirements.length > 0) {
      lines.push('');
      lines.push('✅ Requirements:');
      job.requirements.forEach(req => {
        if (req.trim()) lines.push(`• ${req.trim()}`);
      });
    }
    
    // Responsibilities  
    if (job.responsibilities && job.responsibilities.length > 0) {
      lines.push('');
      lines.push('🎯 Key Responsibilities:');
      job.responsibilities.forEach(resp => {
        if (resp.trim()) lines.push(`• ${resp.trim()}`);
      });
    }
    
    // Perks
    if (job.perks && job.perks.trim()) {
      lines.push('');
      lines.push(`🎁 What we offer: ${job.perks.trim()}`);
    }
    
    // Call to action
    lines.push('');
    lines.push('💬 Interested? Comment below or send me a message!');
    lines.push('');
    lines.push('#hiring #jobs #career #opportunity');
    
    return lines.join('\n');
  };

  // Enhanced posting function
  const postToGroup = async (job, groupName) => {
    try {
      log(`Starting post to group: ${groupName}`);
      showNotification(`Posting "${job.title}" to ${groupName}`, 'info', 0);
      
      // Verify we're on Facebook
      if (!window.location.hostname.includes('facebook.com')) {
        throw new Error('Please navigate to Facebook.com first');
      }

      // Wait for page to load if needed
      await sleep(1000);
      
      // Find the post composer
      let composer = findPostComposer();
      
      if (!composer) {
        // Try clicking "What's on your mind?" to open composer
        const mindPrompts = document.querySelectorAll('[data-testid="status-attachment-mentions-input"], [placeholder*="mind"]');
        for (const prompt of mindPrompts) {
          if (isVisible(prompt)) {
            log('Clicking on composer prompt');
            prompt.click();
            await sleep(2000);
            composer = findPostComposer();
            if (composer) break;
          }
        }
      }
      
      if (!composer) {
        throw new Error('Cannot find post composer. Please click "What\'s on your mind?" to open the post composer first.');
      }

      // Prepare the post content
      const postContent = formatJobPost(job);
      
      // Focus and clear the composer
      composer.focus();
      await sleep(500);
      
      // Clear existing content
      if (composer.tagName === 'TEXTAREA') {
        composer.value = '';
      } else {
        composer.textContent = '';
      }
      
      await sleep(500);

      // Insert the content
      log('Inserting post content');
      if (composer.tagName === 'TEXTAREA') {
        composer.value = postContent;
        composer.dispatchEvent(new Event('input', { bubbles: true }));
        composer.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // For contenteditable divs
        composer.innerHTML = postContent.replace(/\n/g, '<br>');
        composer.dispatchEvent(new Event('input', { bubbles: true }));
        composer.dispatchEvent(new Event('paste', { bubbles: true }));
      }

      // Wait for Facebook to process the content
      await sleep(3000);

      // Show preview to user
      const previewText = postContent.length > 200 ? 
        postContent.substring(0, 200) + '...' : 
        postContent;
        
      const userConfirmed = confirm(
        `Ready to post this job to "${groupName}"?\n\n` +
        `Job: ${job.title}\n` +
        `Company: ${job.company}\n\n` +
        `Preview:\n${previewText}\n\n` +
        `Click OK to post, Cancel to skip this group.`
      );
      
      if (!userConfirmed) {
        log('User cancelled posting', 'warning');
        throw new Error('User cancelled posting');
      }

      // Find and click the post button
      const postButton = findPostButton();
      if (!postButton) {
        // Fallback: ask user to post manually
        const manualPost = confirm(
          'Cannot find the Post button automatically.\n\n' +
          'Please click the POST button manually now, then click OK here.\n\n' +
          'Click OK after posting, or Cancel to mark as failed.'
        );
        
        if (!manualPost) {
          throw new Error('Manual posting cancelled by user');
        }
        
        log('User completed manual posting', 'success');
      } else {
        log('Clicking post button');
        postButton.click();
      }
      
      // Wait for post to complete
      await sleep(CONFIG.delayAfterPost);
      
      // Try to detect if post was successful
      const currentUrl = window.location.href;
      
      log(`Successfully posted to ${groupName}`, 'success');
      showNotification(`✅ Posted to ${groupName}`, 'success');
      
      return { 
        success: true, 
        url: currentUrl,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      log(`Failed to post to ${groupName}: ${error.message}`, 'error');
      showNotification(`❌ Failed: ${groupName} - ${error.message}`, 'error');
      return { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  // Enhanced job processing with better progress tracking
  const processJobs = async (jobs) => {
    const stats = {
      totalJobs: jobs.length,
      totalPosts: jobs.reduce((acc, job) => acc + job.pendingGroups.length, 0),
      completedJobs: 0,
      successfulPosts: 0,
      failedPosts: 0,
      skippedPosts: 0
    };

    log(`Starting to process ${stats.totalJobs} jobs with ${stats.totalPosts} total posts`);
    showNotification(`Processing ${stats.totalJobs} jobs (${stats.totalPosts} posts)`, 'info', 0);

    for (let jobIndex = 0; jobIndex < jobs.length; jobIndex++) {
      const job = jobs[jobIndex];
      const jobProgress = `Job ${jobIndex + 1}/${stats.totalJobs}`;
      
      log(`${jobProgress}: Processing "${job.title}"`);
      showNotification(`${jobProgress}: ${job.title}`, 'info', 0);
      
      for (let groupIndex = 0; groupIndex < job.pendingGroups.length; groupIndex++) {
        const groupName = job.pendingGroups[groupIndex];
        const postProgress = `${jobProgress}, Group ${groupIndex + 1}/${job.pendingGroups.length}`;
        
        log(`${postProgress}: Posting to ${groupName}`);
        
        const result = await postToGroup(job, groupName);
        
        // Update status via API
        try {
          const statusToUpdate = result.success ? 'SUCCESS' : 'FAILED';
          await updateJobStatus(job.id, groupName, statusToUpdate, result.url, result.error);
          
          if (result.success) {
            stats.successfulPosts++;
          } else {
            stats.failedPosts++;
          }
          
          log(`Updated status: ${groupName} = ${statusToUpdate}`);
          
        } catch (apiError) {
          log(`Failed to update status for ${groupName}: ${apiError.message}`, 'error');
          stats.skippedPosts++;
        }

        // Delay between posts (except for the last post)
        const isLastPost = (jobIndex === jobs.length - 1) && (groupIndex === job.pendingGroups.length - 1);
        if (!isLastPost) {
          log(`Waiting ${CONFIG.delayBetweenPosts/1000}s before next post...`);
          showNotification(`Waiting ${CONFIG.delayBetweenPosts/1000}s...`, 'info', CONFIG.delayBetweenPosts);
          await sleep(CONFIG.delayBetweenPosts);
        }
      }
      
      stats.completedJobs++;
      log(`Completed job: ${job.title} (${stats.completedJobs}/${stats.totalJobs})`);
    }

    return stats;
  };

  // Main automation controller
  const runAutomation = async () => {
    try {
      log('FB Auto: Starting automation...');
      showNotification('Starting Facebook Job Automation...', 'info');

      // Fetch pending jobs
      log('Fetching pending jobs from server...');
      const jobs = await fetchPendingJobs();

      if (!jobs || jobs.length === 0) {
        const message = 'No pending jobs found. All jobs are up to date!';
        log(message);
        showNotification(message, 'success');
        alert('✅ ' + message);
        return;
      }

      // Calculate totals
      const totalGroups = jobs.reduce((acc, job) => acc + job.pendingGroups.length, 0);
      
      // Show job summary
      const jobSummary = jobs.map(job => 
        `• ${job.title} (${job.pendingGroups.length} groups)`
      ).join('\n');
      
      const confirmMessage = 
        `Found ${jobs.length} jobs with ${totalGroups} pending posts:\n\n` +
        `${jobSummary}\n\n` +
        `This will take approximately ${Math.ceil(totalGroups * CONFIG.delayBetweenPosts / 1000 / 60)} minutes.\n\n` +
        `Continue with automation?`;

      if (!confirm(confirmMessage)) {
        log('Automation cancelled by user');
        showNotification('Automation cancelled', 'warning');
        return;
      }

      // Start processing
      log('User confirmed, starting job processing...');
      const startTime = Date.now();
      const results = await processJobs(jobs);
      const duration = Math.round((Date.now() - startTime) / 1000);

      // Final summary
      const successRate = results.totalPosts > 0 ? 
        ((results.successfulPosts / results.totalPosts) * 100).toFixed(1) : 0;
        
      const summary = 
        `🎉 Automation Complete!\n\n` +
        `📊 Results:\n` +
        `✅ Successful: ${results.successfulPosts}\n` +
        `❌ Failed: ${results.failedPosts}\n` +
        `⏭️ Skipped: ${results.skippedPosts}\n` +
        `📈 Success Rate: ${successRate}%\n` +
        `⏱️ Duration: ${Math.floor(duration/60)}m ${duration%60}s\n\n` +
        `All job statuses have been updated in your dashboard.`;

      log('Automation completed successfully');
      showNotification('Automation completed!', 'success');
      alert(summary);
      
      log(`Final stats: ${JSON.stringify(results)}`);

    } catch (error) {
      const errorMsg = `Automation failed: ${error.message}`;
      log(errorMsg, 'error');
      showNotification(errorMsg, 'error');
      alert(`❌ ${errorMsg}\n\nCheck the browser console for more details.`);
    } finally {
      window.fbAutoRunning = false;
      // Clean up notifications after a delay
      setTimeout(() => {
        const container = document.getElementById('fb-auto-notifications');
        if (container) container.remove();
      }, 10000);
    }
  };

  // Initialize and run
  log('Facebook Job Automation v2.0 loaded');
  showNotification('FB Auto loaded! Starting...', 'info');
  
  // Small delay to let page settle
  setTimeout(runAutomation, 1000);

})();