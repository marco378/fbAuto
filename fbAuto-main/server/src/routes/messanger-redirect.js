const MESSENGER_LINK = "https://m.me/698738296664477";
const N8N_WEBHOOK_URL = process.env.N8N_JOB_CONTEXT_WEBHOOK_URL || 'https://audace.app.n8n.cloud/webhook/webhook-test';
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'EAAUNrA8WQrUBPldXbeRnqYZAXzbWzi3BDZCsGFSljo8hrKdCIr0q4ZCBQMR79qjp3TTmYQU4aDF8n1TAClCyovCw9gIRiM5V22niGLVlehRdLBiIZB97pofTVD0HOgPPIhfv96JBuPMF8s8ctIrE9xyQcqR7XEqwANZBlYCGT0pPKfkcNpCnzYhg6NKUBmW8bbVyCGlowrgZDZD';
import { prisma } from "../lib/prisma.js";

export const messengerRedirectWithContext = async (req, res) => {
  try {
    const { context } = req.query;
    
    console.log('🔗 Messenger redirect triggered with context');
    
    if (!context) {
      console.log('❌ No context provided, redirecting to messenger anyway');
      return res.redirect(MESSENGER_LINK);
    }
    
    // Decode and validate context
    let decodedContext;
    try {
      decodedContext = JSON.parse(Buffer.from(context, 'base64url').toString());
      console.log('📋 Decoded job context:', decodedContext.jobTitle, 'at', decodedContext.company);
    } catch (e) {
      console.log('❌ Failed to decode context:', e.message);
      return res.redirect(MESSENGER_LINK);
    }

    const { jobPostId } = decodedContext;

    if (!jobPostId) {
      console.log('❌ No job post ID in context');
      return res.redirect(MESSENGER_LINK);
    }

    // Check if the job post still exists and the parent job is active
    const jobPost = await prisma.jobPost.findFirst({
      where: {
        id: jobPostId,
        status: 'SUCCESS'
      },
      include: {
        job: true
      }
    });
    console.log('🔍 [DEBUG] jobPost object:', JSON.stringify(jobPost, null, 2));
    if (jobPost && jobPost.job) {
      console.log('🔍 [DEBUG] jobPost.job object:', JSON.stringify(jobPost.job, null, 2));
    }

  // If job post doesn't exist or parent job is inactive/deleted, show Job Closed page
  if (!jobPost || !jobPost.job || !jobPost.job.isActive) {
    console.log(`Job closed or deleted - JobPost ID: ${jobPostId}`);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Job Closed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  margin: 50px; 
                  background-color: #f5f5f5; 
              }
              .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                  max-width: 400px; 
                  margin: 0 auto; 
              }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Job Closed</h1>
              <p>This job position is no longer available.</p>
              <p>Thank you for your interest!</p>
          </div>
      </body>
      </html>
    `);
  } else {
    // If jobPost and job are valid and active, always redirect to Messenger
    console.log(`✅ Valid jobPost and job found, redirecting to Messenger: ${MESSENGER_LINK}`);
    return res.redirect(MESSENGER_LINK);
  }

  // Check if job has expired
  if (jobPost.job.expiresAt && new Date() > new Date(jobPost.job.expiresAt)) {
    console.log(`Job expired - JobPost ID: ${jobPostId}`);
      
    // Return simple HTML page directly
    return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job Closed</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          margin: 50px; 
          background-color: #f5f5f5; 
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 10px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          max-width: 400px; 
          margin: 0 auto; 
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Job Closed</h1>
        <p>This job position is no longer available.</p>
        <p>Thank you for your interest!</p>
      </div>
    </body>
    </html>
    `);
  }

    // Job exists and is active - proceed with normal flow
    console.log(`Valid job access - JobPost ID: ${jobPostId}, Job: ${jobPost.job.title}`);
    
    // Create unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store context in database FIRST
    const contextSession = await prisma.jobContextSession.create({
      data: {
        sessionToken: sessionId,
        jobPostId: decodedContext.jobPostId || null,
        contextData: decodedContext,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastAccessedAt: new Date()
      }
    });
    
    console.log(`✅ Stored context with session ID: ${sessionId}`);
    
    // Send minimal webhook payload to N8N (just the session ID)
    const webhookPayload = {
      type: 'messenger_context_trigger',
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      contextSessionId: contextSession.id, // Reference to DB record
      jobTitle: decodedContext.jobTitle, // Keep minimal info for N8N logs
      company: decodedContext.company,
      messengerInfo: {
        pageId: MESSENGER_LINK.split('/').pop(),
        redirectUrl: `${MESSENGER_LINK}?ref=${sessionId}`
      }
    };
    
    // Send webhook asynchronously
    sendWebhookToN8N(webhookPayload).catch(error => {
      console.error('❌ Webhook sending failed:', error.message);
    });
    
    console.log('✅ Webhook triggered, redirecting to messenger...');
    
    // Redirect user to messenger with session reference
    res.redirect(`${MESSENGER_LINK}?ref=${sessionId}`);
    
  } catch (error) {
    console.error('❌ Error in messenger redirect:', error);
    // On any error, return job closed page
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Job Closed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  margin: 50px; 
                  background-color: #f5f5f5; 
              }
              .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                  max-width: 400px; 
                  margin: 0 auto; 
              }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Job Closed</h1>
              <p>This job position is no longer available.</p>
              <p>Thank you for your interest!</p>
          </div>
      </body>
      </html>
    `);
  }
};

// Helper function to send webhook to N8N
async function sendWebhookToN8N(payload) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'messenger-webhook'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`);
    }

    console.log('✅ Successfully sent to N8N');
  } catch (error) {
    console.error('❌ Error sending to N8N:', error);
  }
}

// Updated webhook handler to use session-based context retrieval
export const handleMessengerWebhook = async (req, res) => {
  console.log('📥 Received webhook:', JSON.stringify(req.body, null, 2));

  // Verify webhook
  if (req.method === 'GET') {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.sendStatus(403);
  }

  if (req.body.object === 'page') {
    for (const entry of req.body.entry) {
      for (const event of entry.messaging) {
        console.log('📨 Processing event:', JSON.stringify(event, null, 2));
        
        const senderId = event.sender.id;
        console.log('👤 Sender ID:', senderId);

        if (event.referral) {
          console.log('🎯 Referral event detected');
          await handleReferral(event.referral, senderId);
        }
        else if (event.postback?.referral) {
          console.log('🎯 Postback referral detected');
          await handleReferral(event.postback.referral, senderId);
        }
        else if (event.message) {
          console.log('💬 Message event detected');
          await handleMessage(event, senderId);
        }
        else {
          console.log('ℹ️ Other event type:', Object.keys(event));
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
};

// Updated referral handler - now fetches context from database by session ID
async function handleReferral(referral, senderId) {
  try {
    console.log('📦 Raw referral data:', referral);
    
    if (!referral.ref) {
      console.log('⚠️ No ref parameter in referral');
      return;
    }

    const sessionId = referral.ref;
    console.log('🔍 Session ID from referral:', sessionId);

    // Fetch job context from database using session ID
    const contextSession = await prisma.jobContextSession.findUnique({
      where: { 
        sessionToken: sessionId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!contextSession) {
      console.log('❌ No active context found for session:', sessionId);
      // Send webhook anyway but with no job context
      const payload = {
        type: 'messenger_referral',
        timestamp: new Date().toISOString(),
        senderId,
        sessionId,
        error: 'Context not found or expired',
        source: 'facebook_messenger'
      };
      await sendToN8N(payload);
      return;
    }

    // Link this Facebook user to the context session
    await prisma.jobContextSession.update({
      where: { id: contextSession.id },
      data: { 
        facebookUserId: senderId,
        conversationStarted: true,
        lastAccessedAt: new Date()
      }
    });

    const payload = {
      type: 'messenger_referral',
      timestamp: new Date().toISOString(),
      senderId,
      sessionId,
      jobContext: contextSession.contextData, // Full job context from database
      contextSessionId: contextSession.id,
      source: 'facebook_messenger'
    };

    console.log('📤 Sending payload to N8N with retrieved context');
    await sendToN8N(payload);

  } catch (error) {
    console.error('❌ Error handling referral:', error);
  }
}

// Updated message handler - also uses session-based context lookup
async function handleMessage(event, senderId) {
  console.log('💬 Message received from:', senderId);
  console.log('📝 Text:', event.message.text);

  let jobContext = null;
  let sessionId = null;

  // Always prioritize referral/session context if present
  if (event.message.referral && event.message.referral.ref) {
    console.log('🎯 First message with referral data!');
    sessionId = event.message.referral.ref;
    try {
      const contextSession = await prisma.jobContextSession.findUnique({
        where: {
          sessionToken: sessionId,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });
      if (contextSession) {
        jobContext = contextSession.contextData;
        console.log('✅ [NEW] Job context from referral session:', jobContext.jobTitle, jobContext.company, 'Session:', sessionId);
        // Always associate this Facebook user with this session (overwrite any previous association)
        await prisma.jobContextSession.update({
          where: { id: contextSession.id },
          data: {
            facebookUserId: senderId,
            conversationStarted: true,
            lastAccessedAt: new Date()
          }
        });
      } else {
        console.log('❌ No active context found for referral session:', sessionId);
      }
    } catch (error) {
      console.error('❌ Failed to retrieve context from referral session:', error);
    }
  } else {
    // Fallback: find latest context by Facebook user ID
    try {
      const contextSession = await prisma.jobContextSession.findFirst({
        where: {
          facebookUserId: senderId,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { lastAccessedAt: 'desc' }
      });
      if (contextSession) {
        jobContext = contextSession.contextData;
        sessionId = contextSession.sessionToken;
        console.log('✅ [FALLBACK] Retrieved context for user:', jobContext.jobTitle, jobContext.company, 'Session:', sessionId);
        await prisma.jobContextSession.update({
          where: { id: contextSession.id },
          data: { lastAccessedAt: new Date() }
        });
      } else {
        console.log('❌ No context found for Facebook user:', senderId);
      }
    } catch (error) {
      console.error('❌ Failed to retrieve context by user ID:', error);
    }
  }
  
  const webhookPayload = {
    type: 'messenger_message',
    timestamp: new Date().toISOString(),
    senderId: senderId,
    sessionId: sessionId,
    message: {
      text: event.message.text || '',
      attachments: event.message.attachments || []
    },
    jobContext: jobContext, // Will be null if no context found
    source: 'facebook_messenger_message'
  };

  await sendToN8N(webhookPayload);
  console.log('📤 Message data sent to N8N with context:', webhookPayload.jobContext ? webhookPayload.jobContext.jobTitle : 'NO CONTEXT', webhookPayload.jobContext ? webhookPayload.jobContext.company : '');
}

async function sendToN8N(payload) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'messenger-webhook'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`);
    }

    console.log('✅ Successfully sent to N8N');
  } catch (error) {
    console.error('❌ Error sending to N8N:', error);
  }
}

// Express route for messenger redirect
router.get('/api/messenger-redirect', messengerRedirectWithContext);
