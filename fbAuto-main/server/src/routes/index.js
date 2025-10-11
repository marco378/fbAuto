import express from 'express'
import path from 'path'
import authRouter from './auth.router.js'
import facebookRouter from './facebook.router.js'
import jobRouter from './job.route.js'
import candidateRouter from './candidate.route.js'
import cookieRouter from './cookie.router.js'
import manual2FARouter from './manual-2fa.router.js'
import { automationService } from "../services/automation.services.js";
import { jobPostScheduler } from "../services/job-post-scheduler.js";


const router = express.Router()

router.use("/auth", authRouter)
router.use("/facebook", facebookRouter)
router.use("/jobs", jobRouter)
router.use("/candidates", candidateRouter)
router.use("/cookies",cookieRouter)
router.use("/manual-2fa", manual2FARouter)

router.get("/automation/status", async (req, res) => {
  try {
    const serviceStatus = automationService.getServiceStatus();
    const systemStats = await automationService.getSystemStats();
    const schedulerStatus = jobPostScheduler.getStatus();
    
    res.json({
      ...serviceStatus,
      systemStats,
      scheduler: schedulerStatus,
      message: "Local automation service status"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get automation status",
      message: error.message
    });
  }
});

// Enable/disable auto-scheduling
router.post("/automation/scheduler/toggle", async (req, res) => {
  try {
    const { enable } = req.body;
    
    if (enable) {
      jobPostScheduler.enableAutoScheduling();
    } else {
      jobPostScheduler.disableAutoScheduling();
    }
    
    res.json({
      success: true,
      message: `Auto-scheduling ${enable ? 'enabled' : 'disabled'}`,
      scheduler: jobPostScheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve manual 2FA control interface
router.get("/manual-2fa-control", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual 2FA Controller - fbAuto</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1877F2; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .enabled { background-color: #d4edda; color: #155724; }
        .disabled { background-color: #f8d7da; color: #721c24; }
        button { background-color: #1877F2; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin: 10px 10px 10px 0; font-size: 16px; }
        button:hover { background-color: #166fe5; }
        button.success { background-color: #28a745; }
        button.danger { background-color: #dc3545; }
        .log { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 20px 0; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Manual 2FA Controller</h1>
        <div id="status" class="status">Loading status...</div>
        <button onclick="toggleManual2FA(true)" class="success">Enable Manual 2FA Mode</button>
        <button onclick="toggleManual2FA(false)" class="danger">Disable Manual 2FA Mode</button>
        <button onclick="refreshStatus()">🔄 Refresh Status</button>
        <button onclick="runJobWithManual2FA()" class="success">Run Job Posting (Manual 2FA)</button>
        <div id="log" class="log">Ready...</div>
    </div>
    <script>
        const API_BASE = '/api/manual-2fa';
        async function refreshStatus() {
            try {
                const response = await fetch(API_BASE + '/status');
                const data = await response.json();
                document.getElementById('status').textContent = data.message;
                document.getElementById('status').className = 'status ' + (data.manual2FA ? 'enabled' : 'disabled');
            } catch (error) {
                document.getElementById('log').textContent += 'Error: ' + error.message + '\\n';
            }
        }
        async function toggleManual2FA(enable) {
            try {
                const response = await fetch(API_BASE + '/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enable })
                });
                const data = await response.json();
                document.getElementById('log').textContent += (enable ? 'Enabled' : 'Disabled') + ' manual 2FA\\n';
                refreshStatus();
            } catch (error) {
                document.getElementById('log').textContent += 'Error: ' + error.message + '\\n';
            }
        }
        async function runJobWithManual2FA() {
            try {
                document.getElementById('log').textContent += 'Starting job with manual 2FA...\\n';
                const response = await fetch(API_BASE + '/run-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                const data = await response.json();
                document.getElementById('log').textContent += 'Result: ' + data.message + '\\n';
            } catch (error) {
                document.getElementById('log').textContent += 'Error: ' + error.message + '\\n';
            }
        }
        refreshStatus();
    </script>
</body>
</html>
  `);
});

// Serve Client-Side Automation Bookmarklet
router.get("/client-automation", (req, res) => {
  const bookmarkletCode = `javascript:(function(){if(window.fbAutoRunning){alert('FB Auto is already running!');return;}window.fbAutoRunning=true;const CONFIG={apiBaseUrl:'https://fbauto-production-4368.up.railway.app/api',authToken:localStorage.getItem('fb_auto_token'),delayBetweenPosts:8000,delayAfterPost:3000,maxRetries:3,debug:true};const log=(message,type='info')=>{const timestamp=new Date().toISOString().substr(11,8);const prefix=type==='error'?'❌':type==='success'?'✅':type==='warning'?'⚠️':'ℹ️';const logMessage=prefix+' ['+timestamp+'] FB Auto: '+message;console.log(logMessage);if(CONFIG.debug){showNotification(message,type);}};const createNotificationSystem=()=>{if(document.getElementById('fb-auto-notifications'))return;const container=document.createElement('div');container.id='fb-auto-notifications';container.style.cssText='position:fixed;top:20px;right:20px;z-index:999999;max-width:350px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';document.body.appendChild(container);return container;};const showNotification=(message,type='info',duration=5000)=>{const container=createNotificationSystem();const notification=document.createElement('div');const colors={info:'#2196F3',success:'#4CAF50',warning:'#FF9800',error:'#F44336'};notification.style.cssText='background:'+(colors[type]||colors.info)+';color:white;padding:12px 16px;margin-bottom:8px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;line-height:1.4;animation:slideIn 0.3s ease-out;cursor:pointer;';notification.textContent=message;notification.onclick=()=>notification.remove();container.appendChild(notification);if(duration>0){setTimeout(()=>{if(notification.parentNode){notification.style.animation='slideOut 0.3s ease-in';setTimeout(()=>notification.remove(),300);}},duration);}if(!document.getElementById('fb-auto-styles')){const style=document.createElement('style');style.id='fb-auto-styles';style.textContent='@keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}@keyframes slideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(100%);opacity:0;}}';document.head.appendChild(style);}};const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));const apiCall=async(endpoint,options={})=>{if(!CONFIG.authToken){const token=prompt('Please enter your FB Auto authentication token:');if(!token)throw new Error('Authentication token required');CONFIG.authToken=token;localStorage.setItem('fb_auto_token',token);}const url=CONFIG.apiBaseUrl+endpoint;const headers={'Content-Type':'application/json','Authorization':'Bearer '+CONFIG.authToken,...options.headers};log('Making API call to '+endpoint);try{const response=await fetch(url,{...options,headers});if(!response.ok){if(response.status===401){localStorage.removeItem('fb_auto_token');CONFIG.authToken=null;throw new Error('Authentication failed. Token expired or invalid.');}const errorText=await response.text();throw new Error('API Error '+response.status+': '+errorText);}const data=await response.json();log('API call successful: '+endpoint);return data;}catch(error){log('API call failed: '+error.message,'error');throw error;}};const fetchPendingJobs=async()=>{const data=await apiCall('/jobs/client-automation');return data.jobs||[];};const updateJobStatus=async(jobId,groupName,status,postUrl=null,error=null)=>{await apiCall('/jobs/'+jobId+'/update-posting-status',{method:'POST',body:JSON.stringify({facebookGroup:groupName,status,postUrl,error})});};const findPostComposer=()=>{const selectors=['[data-testid="status-attachment-mentions-input"]','[role="textbox"][data-testid]','[contenteditable="true"][role="textbox"]','textarea[data-testid="react-composer-input"]','div[data-testid="react-composer-root"] [contenteditable="true"]','[data-testid="group-composer-input"]','[contenteditable="true"]','textarea[placeholder*="mind"]'];for(const selector of selectors){const element=document.querySelector(selector);if(element&&isVisible(element)){log('Found composer using selector: '+selector);return element;}}log('No composer found with standard selectors','warning');return null;};const isVisible=element=>{if(!element)return false;const style=window.getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&element.offsetWidth>0&&element.offsetHeight>0;};const formatJobPost=job=>{const lines=[];lines.push('🔥 '+job.title);lines.push('🏢 '+job.company);lines.push('');lines.push('📍 Location: '+job.location);lines.push('💼 Job Type: '+job.jobType);if(job.salaryRange){lines.push('💰 Salary: '+job.salaryRange);}lines.push('');lines.push('📝 Description:');lines.push(job.description.trim());if(job.requirements&&job.requirements.length>0){lines.push('');lines.push('✅ Requirements:');job.requirements.forEach(req=>{if(req.trim())lines.push('• '+req.trim());});}if(job.responsibilities&&job.responsibilities.length>0){lines.push('');lines.push('🎯 Key Responsibilities:');job.responsibilities.forEach(resp=>{if(resp.trim())lines.push('• '+resp.trim());});}if(job.perks&&job.perks.trim()){lines.push('');lines.push('🎁 What we offer: '+job.perks.trim());}lines.push('');lines.push('💬 Interested? Comment below or send me a message!');lines.push('');lines.push('#hiring #jobs #career #opportunity');return lines.join('\\n');};const postToGroup=async(job,groupName)=>{try{log('Starting post to group: '+groupName);showNotification('Posting "'+job.title+'" to '+groupName,'info',0);if(!window.location.hostname.includes('facebook.com')){throw new Error('Please navigate to Facebook.com first');}await sleep(1000);let composer=findPostComposer();if(!composer){const mindPrompts=document.querySelectorAll('[data-testid="status-attachment-mentions-input"], [placeholder*="mind"]');for(const prompt of mindPrompts){if(isVisible(prompt)){log('Clicking on composer prompt');prompt.click();await sleep(2000);composer=findPostComposer();if(composer)break;}}}if(!composer){throw new Error('Cannot find post composer. Please click "What\\'s on your mind?" to open the post composer first.');}const postContent=formatJobPost(job);composer.focus();await sleep(500);if(composer.tagName==='TEXTAREA'){composer.value='';}else{composer.textContent='';}await sleep(500);log('Inserting post content');if(composer.tagName==='TEXTAREA'){composer.value=postContent;composer.dispatchEvent(new Event('input',{bubbles:true}));composer.dispatchEvent(new Event('change',{bubbles:true}));}else{composer.innerHTML=postContent.replace(/\\n/g,'<br>');composer.dispatchEvent(new Event('input',{bubbles:true}));composer.dispatchEvent(new Event('paste',{bubbles:true}));}await sleep(3000);const previewText=postContent.length>200?postContent.substring(0,200)+'...':postContent;const userConfirmed=confirm('Ready to post this job to "'+groupName+'"?\\n\\nJob: '+job.title+'\\nCompany: '+job.company+'\\n\\nPreview:\\n'+previewText+'\\n\\nClick OK to post, Cancel to skip this group.');if(!userConfirmed){log('User cancelled posting','warning');throw new Error('User cancelled posting');}const postButton=document.querySelector('[data-testid="react-composer-post-button"], [aria-label="Post"], div[role="button"]:contains("Post")');if(!postButton){const manualPost=confirm('Cannot find the Post button automatically.\\n\\nPlease click the POST button manually now, then click OK here.\\n\\nClick OK after posting, or Cancel to mark as failed.');if(!manualPost){throw new Error('Manual posting cancelled by user');}log('User completed manual posting','success');}else{log('Clicking post button');postButton.click();}await sleep(CONFIG.delayAfterPost);const currentUrl=window.location.href;log('Successfully posted to '+groupName,'success');showNotification('✅ Posted to '+groupName,'success');return{success:true,url:currentUrl,timestamp:new Date().toISOString()};}catch(error){log('Failed to post to '+groupName+': '+error.message,'error');showNotification('❌ Failed: '+groupName+' - '+error.message,'error');return{success:false,error:error.message,timestamp:new Date().toISOString()};}};const processJobs=async jobs=>{const stats={totalJobs:jobs.length,totalPosts:jobs.reduce((acc,job)=>acc+job.pendingGroups.length,0),completedJobs:0,successfulPosts:0,failedPosts:0,skippedPosts:0};log('Starting to process '+stats.totalJobs+' jobs with '+stats.totalPosts+' total posts');showNotification('Processing '+stats.totalJobs+' jobs ('+stats.totalPosts+' posts)','info',0);for(let jobIndex=0;jobIndex<jobs.length;jobIndex++){const job=jobs[jobIndex];const jobProgress='Job '+(jobIndex+1)+'/'+stats.totalJobs;log(jobProgress+': Processing "'+job.title+'"');showNotification(jobProgress+': '+job.title,'info',0);for(let groupIndex=0;groupIndex<job.pendingGroups.length;groupIndex++){const groupName=job.pendingGroups[groupIndex];const postProgress=jobProgress+', Group '+(groupIndex+1)+'/'+job.pendingGroups.length;log(postProgress+': Posting to '+groupName);const result=await postToGroup(job,groupName);try{const statusToUpdate=result.success?'SUCCESS':'FAILED';await updateJobStatus(job.id,groupName,statusToUpdate,result.url,result.error);if(result.success){stats.successfulPosts++;}else{stats.failedPosts++;}log('Updated status: '+groupName+' = '+statusToUpdate);}catch(apiError){log('Failed to update status for '+groupName+': '+apiError.message,'error');stats.skippedPosts++;}const isLastPost=(jobIndex===jobs.length-1)&&(groupIndex===job.pendingGroups.length-1);if(!isLastPost){log('Waiting '+(CONFIG.delayBetweenPosts/1000)+'s before next post...');showNotification('Waiting '+(CONFIG.delayBetweenPosts/1000)+'s...','info',CONFIG.delayBetweenPosts);await sleep(CONFIG.delayBetweenPosts);}}stats.completedJobs++;log('Completed job: '+job.title+' ('+stats.completedJobs+'/'+stats.totalJobs+')');}return stats;};const runAutomation=async()=>{try{log('FB Auto: Starting automation...');showNotification('Starting Facebook Job Automation...','info');log('Fetching pending jobs from server...');const jobs=await fetchPendingJobs();if(!jobs||jobs.length===0){const message='No pending jobs found. All jobs are up to date!';log(message);showNotification(message,'success');alert('✅ '+message);return;}const totalGroups=jobs.reduce((acc,job)=>acc+job.pendingGroups.length,0);const jobSummary=jobs.map(job=>'• '+job.title+' ('+job.pendingGroups.length+' groups)').join('\\n');const confirmMessage='Found '+jobs.length+' jobs with '+totalGroups+' pending posts:\\n\\n'+jobSummary+'\\n\\nThis will take approximately '+Math.ceil(totalGroups*CONFIG.delayBetweenPosts/1000/60)+' minutes.\\n\\nContinue with automation?';if(!confirm(confirmMessage)){log('Automation cancelled by user');showNotification('Automation cancelled','warning');return;}log('User confirmed, starting job processing...');const startTime=Date.now();const results=await processJobs(jobs);const duration=Math.round((Date.now()-startTime)/1000);const successRate=results.totalPosts>0?((results.successfulPosts/results.totalPosts)*100).toFixed(1):0;const summary='🎉 Automation Complete!\\n\\n📊 Results:\\n✅ Successful: '+results.successfulPosts+'\\n❌ Failed: '+results.failedPosts+'\\n⏭️ Skipped: '+results.skippedPosts+'\\n📈 Success Rate: '+successRate+'%\\n⏱️ Duration: '+Math.floor(duration/60)+'m '+(duration%60)+'s\\n\\nAll job statuses have been updated in your dashboard.';log('Automation completed successfully');showNotification('Automation completed!','success');alert(summary);log('Final stats: '+JSON.stringify(results));}catch(error){const errorMsg='Automation failed: '+error.message;log(errorMsg,'error');showNotification(errorMsg,'error');alert('❌ '+errorMsg+'\\n\\nCheck the browser console for more details.');}finally{window.fbAutoRunning=false;setTimeout(()=>{const container=document.getElementById('fb-auto-notifications');if(container)container.remove();},10000);}};log('Facebook Job Automation v2.0 loaded');showNotification('FB Auto loaded! Starting...','info');setTimeout(runAutomation,1000);})();`;

  const silentBookmarkletCode = `javascript:(function(){if(window.fbAutoSilentRunning){console.log('🔄 FB Auto Silent is already running');return;}window.fbAutoSilentRunning=true;const CONFIG={apiBaseUrl:'https://fbauto-production-4368.up.railway.app/api',authToken:localStorage.getItem('fb_auto_token'),delayBetweenPosts:10000,delayAfterPost:5000,maxRetries:3,debug:false,pollInterval:30000,silentMode:true,autoStart:true};const log=(message,type='info')=>{const timestamp=new Date().toISOString().substr(11,8);const prefix=type==='error'?'❌':type==='success'?'✅ Silent':'🔄 Silent';console.log(prefix+' ['+timestamp+'] '+message);};const updateStatus=message=>{document.title='FB Auto: '+message;log(message);};const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));const apiCall=async(endpoint,options={})=>{if(!CONFIG.authToken){throw new Error('Auth token required for silent mode. Please run the interactive version first to set your token.');}const url=CONFIG.apiBaseUrl+endpoint;const headers={'Content-Type':'application/json','Authorization':'Bearer '+CONFIG.authToken,...options.headers};try{const response=await fetch(url,{...options,headers});if(!response.ok){if(response.status===401){localStorage.removeItem('fb_auto_token');CONFIG.authToken=null;throw new Error('Authentication failed. Token expired.');}const errorText=await response.text();throw new Error('API Error '+response.status+': '+errorText);}return await response.json();}catch(error){log('API call failed: '+error.message,'error');throw error;}};const fetchPendingJobs=async()=>{const data=await apiCall('/jobs/client-automation');return data.jobs||[];};const updateJobStatus=async(jobId,groupName,status,postUrl=null,error=null)=>{await apiCall('/jobs/'+jobId+'/update-posting-status',{method:'POST',body:JSON.stringify({facebookGroup:groupName,status,postUrl,error})});};const findPostComposer=()=>{const selectors=['[data-testid="status-attachment-mentions-input"]','[role="textbox"][data-testid]','[contenteditable="true"][role="textbox"]','textarea[data-testid="react-composer-input"]','div[data-testid="react-composer-root"] [contenteditable="true"]','[data-testid="group-composer-input"]','[contenteditable="true"]','textarea[placeholder*="mind"]'];for(const selector of selectors){const element=document.querySelector(selector);if(element&&isVisible(element)){return element;}}return null;};const findPostButton=()=>{const selectors=['[data-testid="react-composer-post-button"]','[aria-label="Post"]','div[role="button"][tabindex="0"]','[data-testid="post-button"]','button[type="submit"]'];for(const selector of selectors){const elements=document.querySelectorAll(selector);for(const element of elements){const text=element.textContent.toLowerCase();if(text.includes('post')&&isVisible(element)&&!element.disabled){return element;}}}return null;};const isVisible=element=>{if(!element)return false;const style=window.getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&element.offsetWidth>0&&element.offsetHeight>0;};const formatJobPost=job=>{const lines=[];lines.push('🔥 '+job.title);lines.push('🏢 '+job.company);lines.push('');lines.push('📍 Location: '+job.location);lines.push('💼 Job Type: '+job.jobType);if(job.salaryRange){lines.push('💰 Salary: '+job.salaryRange);}lines.push('');lines.push('📝 Description:');lines.push(job.description.trim());if(job.requirements&&job.requirements.length>0){lines.push('');lines.push('✅ Requirements:');job.requirements.forEach(req=>{if(req.trim())lines.push('• '+req.trim());});}if(job.responsibilities&&job.responsibilities.length>0){lines.push('');lines.push('🎯 Key Responsibilities:');job.responsibilities.forEach(resp=>{if(resp.trim())lines.push('• '+resp.trim());});}if(job.perks&&job.perks.trim()){lines.push('');lines.push('🎁 What we offer: '+job.perks.trim());}lines.push('');lines.push('💬 Interested? Comment below or send me a message!');lines.push('');lines.push('#hiring #jobs #career #opportunity');return lines.join('\\n');};const postToGroupSilent=async(job,groupName)=>{try{updateStatus('Posting "'+job.title+'" to '+groupName+'...');if(!window.location.hostname.includes('facebook.com')){throw new Error('Please navigate to Facebook.com first');}await sleep(2000);let composer=findPostComposer();if(!composer){const mindPrompts=document.querySelectorAll('[data-testid="status-attachment-mentions-input"], [placeholder*="mind"]');for(const prompt of mindPrompts){if(isVisible(prompt)){prompt.click();await sleep(3000);composer=findPostComposer();if(composer)break;}}}if(!composer){throw new Error('Cannot find post composer on this page');}const postContent=formatJobPost(job);composer.focus();await sleep(1000);if(composer.tagName==='TEXTAREA'){composer.value='';await sleep(500);composer.value=postContent;composer.dispatchEvent(new Event('input',{bubbles:true}));composer.dispatchEvent(new Event('change',{bubbles:true}));}else{composer.textContent='';await sleep(500);composer.innerHTML=postContent.replace(/\\n/g,'<br>');composer.dispatchEvent(new Event('input',{bubbles:true}));composer.dispatchEvent(new Event('paste',{bubbles:true}));}await sleep(4000);const postButton=findPostButton();if(!postButton){throw new Error('Cannot find Post button');}log('Auto-posting "'+job.title+'" to '+groupName);postButton.click();await sleep(CONFIG.delayAfterPost);const currentUrl=window.location.href;log('Successfully posted to '+groupName,'success');return{success:true,url:currentUrl,timestamp:new Date().toISOString()};}catch(error){log('Failed to post to '+groupName+': '+error.message,'error');return{success:false,error:error.message,timestamp:new Date().toISOString()};}};const processJobsSilent=async jobs=>{const stats={totalJobs:jobs.length,totalPosts:jobs.reduce((acc,job)=>acc+job.pendingGroups.length,0),completedJobs:0,successfulPosts:0,failedPosts:0,skippedPosts:0};updateStatus('Processing '+stats.totalJobs+' jobs ('+stats.totalPosts+' posts) silently...');for(let jobIndex=0;jobIndex<jobs.length;jobIndex++){const job=jobs[jobIndex];updateStatus('Job '+(jobIndex+1)+'/'+stats.totalJobs+': '+job.title);for(let groupIndex=0;groupIndex<job.pendingGroups.length;groupIndex++){const groupName=job.pendingGroups[groupIndex];const result=await postToGroupSilent(job,groupName);try{const statusToUpdate=result.success?'SUCCESS':'FAILED';await updateJobStatus(job.id,groupName,statusToUpdate,result.url,result.error);if(result.success){stats.successfulPosts++;}else{stats.failedPosts++;}}catch(apiError){log('Failed to update status for '+groupName+': '+apiError.message,'error');stats.skippedPosts++;}const isLastPost=(jobIndex===jobs.length-1)&&(groupIndex===job.pendingGroups.length-1);if(!isLastPost){updateStatus('Waiting '+(CONFIG.delayBetweenPosts/1000)+'s before next post...');await sleep(CONFIG.delayBetweenPosts);}}stats.completedJobs++;}return stats;};const startContinuousMonitoring=async()=>{log('Starting continuous job monitoring...');while(window.fbAutoSilentRunning){try{updateStatus('Checking for new jobs...');const jobs=await fetchPendingJobs();if(jobs&&jobs.length>0){const totalGroups=jobs.reduce((acc,job)=>acc+job.pendingGroups.length,0);log('Found '+jobs.length+' jobs with '+totalGroups+' pending posts - starting silent automation');const results=await processJobsSilent(jobs);const successRate=results.totalPosts>0?((results.successfulPosts/results.totalPosts)*100).toFixed(1):0;log('Automation cycle complete: '+results.successfulPosts+'/'+results.totalPosts+' successful ('+successRate+'%)');updateStatus('Cycle complete: '+results.successfulPosts+'/'+results.totalPosts+' posted');}else{updateStatus('No pending jobs - monitoring...');}await sleep(CONFIG.pollInterval);}catch(error){log('Monitoring error: '+error.message,'error');updateStatus('Error: '+error.message+' - retrying in '+(CONFIG.pollInterval/1000)+'s');await sleep(CONFIG.pollInterval);}}};const runSilentAutomation=async()=>{try{log('FB Auto Silent Mode starting...');updateStatus('Silent automation starting...');if(!CONFIG.authToken){const errorMsg='No auth token found. Please run the interactive version first to set up authentication.';updateStatus(errorMsg);log(errorMsg,'error');return;}if(!window.location.hostname.includes('facebook.com')){const errorMsg='Please navigate to Facebook.com to start silent automation';updateStatus(errorMsg);log(errorMsg,'error');return;}updateStatus('Authentication verified - starting monitoring...');await startContinuousMonitoring();}catch(error){const errorMsg='Silent automation failed: '+error.message;log(errorMsg,'error');updateStatus(errorMsg);}finally{window.fbAutoSilentRunning=false;}};window.stopFBAutoSilent=()=>{window.fbAutoSilentRunning=false;updateStatus('Silent automation stopped by user');log('Silent automation stopped manually');};updateStatus('FB Auto Silent Mode loaded');log('Facebook Job Automation Silent Mode v1.0 loaded');setTimeout(runSilentAutomation,2000);})();`;
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client-Side Automation - fbAuto</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        h1 { color: #1877F2; text-align: center; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-style: italic; }
        .hero { background: linear-gradient(135deg, #1877F2, #42a5f5); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
        .feature { display: flex; align-items: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .feature-icon { font-size: 24px; margin-right: 15px; }
        .bookmarklet-section { background: #fff3cd; border: 2px solid #ffeaa7; border-radius: 10px; padding: 25px; margin: 30px 0; }
        .bookmarklet-code { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; margin: 15px 0; max-height: 200px; overflow-y: auto; }
        .copy-button { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px 10px 10px 0; }
        .copy-button:hover { background: #218838; }
        .install-steps { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; }
        .install-steps ol { margin: 10px 0; padding-left: 20px; }
        .install-steps li { margin: 8px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .demo-video { text-align: center; margin: 30px 0; }
        .demo-video iframe { border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .status-check { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .api-test { margin-top: 20px; }
        .api-test button { background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        .api-test button:hover { background: #138496; }
        #apiResult { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px; margin-top: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Client-Side Facebook Automation</h1>
        <p class="subtitle">Run job posting automation directly in your browser</p>
        
        <div class="hero">
            <h2>🎯 The Smart Solution</h2>
            <p>Instead of fighting Facebook's cloud automation detection, we bring the automation to YOUR browser where you're already logged in!</p>
        </div>

        <div class="feature">
            <span class="feature-icon">🔒</span>
            <div>
                <strong>Uses Your Real Browser Session</strong><br>
                No more 2FA issues - uses your existing Facebook login
            </div>
        </div>

        <div class="feature">
            <span class="feature-icon">🏠</span>
            <div>
                <strong>Runs from Your Device</strong><br>
                Uses your residential IP instead of cloud data centers
            </div>
        </div>

        <div class="feature">
            <span class="feature-icon">⚡</span>
            <div>
                <strong>Smart Automation</strong><br>
                Automatically fetches jobs, posts to groups, and updates status
            </div>
        </div>

        <div class="feature">
            <span class="feature-icon">📊</span>
            <div>
                <strong>Full Integration</strong><br>
                Works with your existing dashboard and job management
            </div>
        </div>

        <div class="bookmarklet-section">
            <h3>📌 Bookmarklet Installation</h3>
            <p>Copy the code below and save it as a bookmark. Then run it on any Facebook page!</p>
            
            <div class="bookmarklet-code" id="bookmarkletCode">${bookmarkletCode}</div>
            
            <button class="copy-button" onclick="copyBookmarklet()">📋 Copy Bookmarklet</button>
            <button class="copy-button" onclick="openFacebook()" style="background: #1877F2;">🔗 Open Facebook</button>
        </div>

        <div class="install-steps">
            <h3>📝 Installation Steps</h3>
            <ol>
                <li><strong>Copy the bookmarklet code</strong> by clicking the "Copy Bookmarklet" button above</li>
                <li><strong>Create a new bookmark</strong> in your browser (Ctrl/Cmd+D or right-click bookmarks bar)</li>
                <li><strong>Name it</strong> "FB Auto Job Poster" or similar</li>
                <li><strong>Paste the code as the URL</strong> (replace any existing URL)</li>
                <li><strong>Save the bookmark</strong></li>
                <li><strong>Go to Facebook.com</strong> and make sure you're logged in</li>
                <li><strong>Click your new bookmark</strong> to start automation!</li>
            </ol>
        </div>

        <div class="warning">
            <h4>⚠️ Important Notes</h4>
            <ul>
                <li>You need to be <strong>logged in to Facebook</strong> for this to work</li>
                <li>The automation will ask for your <strong>authentication token</strong> on first use</li>
                <li>Make sure to <strong>stay on the page</strong> while automation is running</li>
                <li>The script will ask for confirmation before posting each job</li>
                <li>You can cancel at any time by refreshing the page</li>
            </ul>
        </div>

        <div class="success">
            <h4>✅ How It Works</h4>
            <ol>
                <li>The bookmarklet fetches your pending jobs from the cloud</li>
                <li>For each job, it fills out the Facebook post composer</li>
                <li>It asks for your confirmation before posting</li>
                <li>After posting, it reports the status back to your dashboard</li>
                <li>Continue until all jobs are posted!</li>
            </ol>
        </div>

        <div class="status-check">
            <h3>🔧 System Status</h3>
            <p>Test your connection to the API before using the bookmarklet:</p>
            
            <div class="api-test">
                <button onclick="testApiConnection()">Test API Connection</button>
                <button onclick="checkPendingJobs()">Check Pending Jobs</button>
                <button onclick="getAuthToken()">Get Auth Token</button>
                
                <div id="apiResult">Click a button above to test the API...</div>
            </div>
        </div>

        <div class="demo-video">
            <h3>🎥 Demo Video</h3>
            <p>Watch how to use the client-side automation:</p>
            <div style="background: #f0f0f0; padding: 40px; border-radius: 10px; color: #666;">
                📹 Demo video coming soon...
            </div>
        </div>
    </div>

    <script>
        function copyBookmarklet() {
            const code = document.getElementById('bookmarkletCode').textContent;
            navigator.clipboard.writeText(code).then(() => {
                alert('✅ Bookmarklet code copied to clipboard!\\n\\nNow create a new bookmark and paste this as the URL.');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback: select the text
                const range = document.createRange();
                range.selectNode(document.getElementById('bookmarkletCode'));
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                alert('📋 Code selected. Press Ctrl/Cmd+C to copy.');
            });
        }

        function openFacebook() {
            window.open('https://facebook.com', '_blank');
        }

        async function testApiConnection() {
            const result = document.getElementById('apiResult');
            result.textContent = 'Testing API connection...';
            
            try {
                const response = await fetch('/api/automation/status');
                const data = await response.json();
                result.textContent = \`✅ API Connection Successful!\\n\\nServer Status: \${data.message}\\nScheduler: \${data.scheduler?.enabled ? 'Enabled' : 'Disabled'}\\nLast Check: \${new Date().toLocaleString()}\`;
            } catch (error) {
                result.textContent = \`❌ API Connection Failed!\\n\\nError: \${error.message}\\nPlease check your internet connection and try again.\`;
            }
        }

        async function checkPendingJobs() {
            const result = document.getElementById('apiResult');
            result.textContent = 'Checking for pending jobs...';
            
            const token = localStorage.getItem('fb_auto_token') || prompt('Enter your auth token to check pending jobs:');
            if (!token) {
                result.textContent = '❌ Authentication token required to check jobs.';
                return;
            }
            
            try {
                const response = await fetch('/api/jobs/client-automation', {
                    headers: {
                        'Authorization': \`Bearer \${token}\`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const data = await response.json();
                const jobs = data.jobs || [];
                const totalGroups = jobs.reduce((acc, job) => acc + job.pendingGroups.length, 0);
                
                if (jobs.length === 0) {
                    result.textContent = '✅ No pending jobs found!\\n\\nAll your jobs are up to date.';
                } else {
                    const jobList = jobs.map(job => \`• \${job.title} (\${job.pendingGroups.length} groups)\`).join('\\n');
                    result.textContent = \`📋 Found \${jobs.length} jobs with \${totalGroups} pending posts:\\n\\n\${jobList}\\n\\nReady for automation!\`;
                }
                
                // Store token for future use
                localStorage.setItem('fb_auto_token', token);
                
            } catch (error) {
                result.textContent = \`❌ Failed to check pending jobs!\\n\\nError: \${error.message}\\n\\nPlease check your auth token and try again.\`;
            }
        }

        function getAuthToken() {
            const result = document.getElementById('apiResult');
            const stored = localStorage.getItem('fb_auto_token');
            
            if (stored) {
                result.textContent = \`🔑 Your stored auth token:\\n\\n\${stored}\\n\\nThis token will be used automatically by the bookmarklet.\\n\\nTo change it, clear your browser's local storage or enter a new one when prompted.\`;
            } else {
                const token = prompt('Enter your FB Auto authentication token:');
                if (token) {
                    localStorage.setItem('fb_auto_token', token);
                    result.textContent = \`✅ Auth token saved!\\n\\nToken: \${token}\\n\\nThis will be used automatically by the bookmarklet.\`;
                } else {
                    result.textContent = '❌ No token entered.\\n\\nYou\\'ll be prompted for your token when using the bookmarklet.';
                }
            }
        }

        // Auto-test API on load
        window.addEventListener('load', () => {
            setTimeout(testApiConnection, 1000);
        });
    </script>
</body>
</html>
  `);
});

export default router