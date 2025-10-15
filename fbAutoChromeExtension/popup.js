
document.getElementById('fetchAndPostJob').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const groupLinkDiv = document.getElementById('groupLinkContainer');
  statusDiv.textContent = 'Fetching latest job...';
  try {
    const apiUrl = 'https://fbauto-production.up.railway.app/api/jobs?limit=1&sort=desc';
    const response = await fetch(apiUrl, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch job data');
    const data = await response.json();
    const job = Array.isArray(data.jobs) ? data.jobs[0] : (data.job || data);
    if (!job) throw new Error('No job found');
    let groupUrl = '';
    if (Array.isArray(job.facebookGroups) && job.facebookGroups.length > 0) {
      groupUrl = job.facebookGroups[0];
    } else if (typeof job.facebookGroups === 'string') {
      groupUrl = job.facebookGroups;
    }
    if (groupUrl) {
      // Check if current tab is already on the group page
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (!currentTab.url || !currentTab.url.startsWith(groupUrl)) {
          // Not on group page, open it in a new tab
          chrome.tabs.create({ url: groupUrl }, function(newTab) {
            statusDiv.textContent = 'Group page opened. Please click the extension again on the group page to post.';
          });
        } else {
          // Already on group page, inject post
          statusDiv.textContent = 'Injecting job post...';
          chrome.scripting.executeScript({
            target: {tabId: currentTab.id},
            func: postJobToFacebook,
            args: [job]
          });
        }
      });
      return;
    }
    statusDiv.textContent = 'No group link found in job data.';
  } catch (err) {
    statusDiv.textContent = 'Error: ' + err.message;
  }
});

function formatJobPost(job) {
  let postContent = `${job.title} at ${job.company}\n\n`;
  postContent += `Location: ${job.location}\n`;
  postContent += `Type: ${job.jobType}\n`;
  if (job.salaryRange) postContent += `Salary: ${job.salaryRange}\n`;
  postContent += `\nAbout the Role:\n${job.description}\n\n`;
  if (Array.isArray(job.requirements) && job.requirements.length > 0) {
    postContent += `Requirements:\n`;
    job.requirements.forEach((req) => (postContent += `• ${req}\n`));
    postContent += `\n`;
  }
  if (Array.isArray(job.responsibilities) && job.responsibilities.length > 0) {
    postContent += `Responsibilities:\n`;
    job.responsibilities.forEach((resp) => (postContent += `• ${resp}\n`));
    postContent += `\n`;
  }
  if (job.perks) postContent += `Perks: ${job.perks}\n\n`;
  if (job.jobLink) {
    postContent += `🎯 Interested? Apply directly here: ${job.jobLink}\n\n`;
  } else {
    postContent += `Interested? send me a \"hello\" by clicking the link!\n\n`;
  }
  postContent += `#hiring #jobs #${job.jobType ? job.jobType.toLowerCase() : ''} #${job.location ? job.location.toLowerCase().replace(/\s+/g, "") : ''}`;
  return postContent;
}

function postJobToFacebook(job) {
  // Playwright-style robust checks and selectors
  const selectors = [
    '[role="textbox"]',
    '[aria-label="Write something..."]',
    '[aria-label="Create a post"]',
    '[data-testid="post-composer-input"]',
    '[data-testid="post-creation-composer"]',
    '[aria-label="What\'s on your mind?"]',
    'div[role="textbox"][contenteditable="true"]',
    '[data-testid="composer-input"]',
    'textarea[placeholder="What\'s on your mind?"]',
    'div[data-testid="status-attachment-mentions-input"]',
    '[data-testid="group-post-composer"]',
  ];
  let composer = null;
  for (const selector of selectors) {
    composer = document.querySelector(selector);
    if (composer) break;
  }
  // Playwright-style login and page checks
  const pageContent = document.body.innerText.toLowerCase();
  if (pageContent.includes('log in') || pageContent.includes('sign in') || pageContent.includes('login')) {
    alert('You are not logged in to Facebook. Please log in and try again.');
    return;
  }
  if (pageContent.includes('checkpoint') || pageContent.includes('security check') || pageContent.includes('verify your identity')) {
    alert('Facebook security checkpoint detected. Please resolve it and try again.');
    return;
  }
  if (pageContent.includes('two-factor') || pageContent.includes('2fa') || pageContent.includes('authentication code')) {
    alert('2FA authentication required. Please complete it and try again.');
    return;
  }
  if (pageContent.includes("you can't post") || pageContent.includes('posting restricted') || pageContent.includes('unable to post')) {
    alert('Posting is restricted in this group.');
    return;
  }
  if (composer) {
    composer.focus();
    composer.innerHTML = formatJobPost(job).replace(/\n/g, '<br>');
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    alert('Job post filled in Facebook composer. Please review and click Post.');
  } else {
    alert('Could not find Facebook post composer. Please click in the post box and try again.');
  }
}
