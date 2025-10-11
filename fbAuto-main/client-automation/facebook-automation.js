/**
 * Facebook Job Posting Automation Bookmarklet
 * 
 * This script runs in the user's browser to automate Facebook job posting
 * using their real browser session and cookies.
 * 
 * How it works:
 * 1. Fetches pending jobs from the cloud API
 * 2. Guides user through Facebook group posting
 * 3. Reports results back to the cloud
 * 
 * Usage: Save as bookmarklet or run in browser console
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiBaseUrl: 'https://fbauto-production-4368.up.railway.app/api',
    authToken: localStorage.getItem('fb_auto_token') || prompt('Enter your auth token:'),
    delayBetweenPosts: 5000, // 5 seconds between posts
    maxRetries: 3,
  };

  // Save auth token if entered
  if (CONFIG.authToken && !localStorage.getItem('fb_auto_token')) {
    localStorage.setItem('fb_auto_token', CONFIG.authToken);
  }

  // Utility functions
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const log = (message, type = 'info') => {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} FB Auto: ${message}`);
  };

  const showProgress = (message, progress = null) => {
    const progressText = progress ? ` (${progress})` : '';
    document.title = `FB Auto: ${message}${progressText}`;
    log(message + progressText);
  };

  // API calls
  const apiCall = async (endpoint, options = {}) => {
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
          throw new Error('Authentication failed. Please refresh and enter your token again.');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

  // Facebook DOM manipulation functions
  const findPostButton = () => {
    // Multiple selectors for different Facebook interfaces
    const selectors = [
      '[data-testid="react-composer-post-button"]',
      '[aria-label="Post"]',
      'div[role="button"]:contains("Post")',
      '[data-testid="post-button"]',
      'button:contains("Post")'
    ];
    
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && button.textContent.toLowerCase().includes('post')) {
        return button;
      }
    }
    return null;
  };

  const findTextarea = () => {
    const selectors = [
      '[data-testid="status-attachment-mentions-input"]',
      '[data-testid="react-composer-root"] textarea',
      'div[role="textbox"]',
      '[contenteditable="true"]',
      'textarea[placeholder*="mind"]',
      'div[data-testid="status-attachment-mentions-input"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  };

  const formatJobPost = (job) => {
    const post = [];
    
    post.push(`🔥 ${job.title} - ${job.company}`);
    post.push('');
    post.push(`📍 Location: ${job.location}`);
    post.push(`💼 Type: ${job.jobType}`);
    
    if (job.salaryRange) {
      post.push(`💰 Salary: ${job.salaryRange}`);
    }
    
    post.push('');
    post.push('📋 Description:');
    post.push(job.description);
    
    if (job.requirements && job.requirements.length > 0) {
      post.push('');
      post.push('✅ Requirements:');
      job.requirements.forEach(req => post.push(`• ${req}`));
    }
    
    if (job.responsibilities && job.responsibilities.length > 0) {
      post.push('');
      post.push('🎯 Responsibilities:');
      job.responsibilities.forEach(resp => post.push(`• ${resp}`));
    }
    
    if (job.perks) {
      post.push('');
      post.push(`🎁 Perks: ${job.perks}`);
    }
    
    post.push('');
    post.push('💬 Interested? Comment below or DM me!');
    post.push('#hiring #jobs #opportunity');
    
    return post.join('\n');
  };

  const postToGroup = async (job, groupName) => {
    try {
      showProgress(`Posting to ${groupName}...`);
      
      // Check if we're on Facebook
      if (!window.location.hostname.includes('facebook.com')) {
        throw new Error('Please run this on Facebook.com');
      }

      // Find and focus on the text area
      const textarea = findTextarea();
      if (!textarea) {
        throw new Error('Could not find Facebook post text area. Please click on "What\'s on your mind?" first.');
      }

      // Format the job post
      const postContent = formatJobPost(job);
      
      // Set the content
      textarea.focus();
      
      if (textarea.tagName === 'TEXTAREA') {
        textarea.value = postContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // For contenteditable divs
        textarea.textContent = postContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Wait for content to be processed
      await sleep(2000);

      // Find and click post button
      const postButton = findPostButton();
      if (!postButton) {
        throw new Error('Could not find Post button. Please post manually and press OK when done.');
      }

      // Show confirmation dialog
      const userConfirmed = confirm(`Ready to post job "${job.title}" to group "${groupName}"?\n\nClick OK to post, or Cancel to skip this group.`);
      
      if (!userConfirmed) {
        throw new Error('User cancelled posting');
      }

      // Click the post button
      postButton.click();
      
      // Wait for post to complete
      await sleep(3000);
      
      // Try to get the post URL (this might not work due to Facebook's dynamic nature)
      const currentUrl = window.location.href;
      
      log(`Successfully posted to ${groupName}`, 'success');
      return { success: true, url: currentUrl };
      
    } catch (error) {
      log(`Failed to post to ${groupName}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  };

  const processJobs = async (jobs) => {
    let totalPosts = 0;
    let successfulPosts = 0;
    let failedPosts = 0;

    for (const job of jobs) {
      showProgress(`Processing job: ${job.title}`, `${jobs.indexOf(job) + 1}/${jobs.length}`);
      
      for (const groupName of job.pendingGroups) {
        totalPosts++;
        
        const result = await postToGroup(job, groupName);
        
        try {
          if (result.success) {
            await updateJobStatus(job.id, groupName, 'SUCCESS', result.url);
            successfulPosts++;
          } else {
            await updateJobStatus(job.id, groupName, 'FAILED', null, result.error);
            failedPosts++;
          }
        } catch (apiError) {
          log(`Failed to update status for ${groupName}: ${apiError.message}`, 'error');
        }

        // Wait between posts to avoid rate limiting
        if (totalPosts < jobs.reduce((acc, j) => acc + j.pendingGroups.length, 0)) {
          showProgress(`Waiting ${CONFIG.delayBetweenPosts/1000}s before next post...`);
          await sleep(CONFIG.delayBetweenPosts);
        }
      }
    }

    return { totalPosts, successfulPosts, failedPosts };
  };

  // Main automation function
  const runAutomation = async () => {
    try {
      if (!CONFIG.authToken) {
        alert('No auth token provided. Please refresh and enter your token.');
        return;
      }

      showProgress('Fetching pending jobs...');
      const jobs = await fetchPendingJobs();

      if (jobs.length === 0) {
        showProgress('No pending jobs found');
        alert('✅ All jobs are up to date! No posting needed.');
        return;
      }

      const totalGroups = jobs.reduce((acc, job) => acc + job.pendingGroups.length, 0);
      
      const proceed = confirm(
        `Found ${jobs.length} jobs with ${totalGroups} pending group posts.\n\n` +
        `Jobs to process:\n${jobs.map(j => `• ${j.title} (${j.pendingGroups.length} groups)`).join('\n')}\n\n` +
        `Click OK to start automation, or Cancel to stop.`
      );

      if (!proceed) {
        showProgress('Automation cancelled by user');
        return;
      }

      showProgress('Starting automation...');
      const results = await processJobs(jobs);

      // Final summary
      const summary = `
Automation Complete! 📊

✅ Successful: ${results.successfulPosts}
❌ Failed: ${results.failedPosts}
📊 Total: ${results.totalPosts}

Success Rate: ${((results.successfulPosts / results.totalPosts) * 100).toFixed(1)}%
      `.trim();

      showProgress('Automation completed');
      alert(summary);
      log(summary.replace(/\n/g, ' | '));

    } catch (error) {
      const errorMsg = `Automation failed: ${error.message}`;
      showProgress(errorMsg);
      alert(`❌ ${errorMsg}`);
      log(errorMsg, 'error');
    }
  };

  // Initialize
  log('Facebook Job Automation Bookmarklet loaded');
  runAutomation();

})();