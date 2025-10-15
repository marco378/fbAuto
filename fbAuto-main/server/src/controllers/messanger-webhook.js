import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://prudvi.app.n8n.cloud/webhook-test/webhook-test';
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'EAAUNrA8WQrUBPc75RtQwhCQiZAgmG8yHhmJdT6CVluVcS7JK2BVnntUFtyAq9DUYMx2ScZCl4FVYr2PxbVfZAvM4TZBlJPo49YNmrPKI9SVjSCFk28Wsdzp0ZCry5BPuOxuV4EPYOuZCrvmz9V99NkqbEXhPWZBDhGDbfMVPGAUNuHkWMgbP7d52gxj1RVEZCcyBMxjX2gZDZD';

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

async function handleReferral(referral, senderId) {
  try {
    console.log('📦 Raw referral data:', referral);
    
    if (!referral.ref) {
      console.log('⚠️ No ref parameter in referral');
      return;
    }

    const refData = JSON.parse(Buffer.from(referral.ref, 'base64url').toString());
    console.log('🔍 Decoded ref data:', refData);

    // Store job context in database
    await storeJobContext(senderId, refData);

    const payload = {
      type: 'messenger_referral',
      timestamp: new Date().toISOString(),
      senderId,
      jobContext: refData,
      isFirstMessage: true, // Flag for n8n to store full context
      rawReferral: referral,
      source: 'facebook_messenger'
    };

    console.log('📤 Sending payload to N8N:', payload);
    await sendToN8N(payload);

  } catch (error) {
    console.error('❌ Error handling referral:', error);
  }
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

// Handle regular messages
async function handleMessage(event, senderId) {
  console.log('💬 Message received from:', senderId);
  console.log('📝 Text:', event.message.text);
  
  // Check if this is the FIRST message and has referral data
  let jobContext = null;
  let isFirstMessage = false;

  if (event.message.referral && event.message.referral.ref) {
    console.log('🎯 First message with referral data!');
    try {
      const decodedRef = JSON.parse(Buffer.from(event.message.referral.ref, 'base64url').toString());
      jobContext = decodedRef;
      isFirstMessage = true;
      
      // Store in database
      await storeJobContext(senderId, decodedRef);
      console.log('✅ Job context from message:', jobContext);
    } catch (error) {
      console.error('❌ Failed to decode message referral:', error);
    }
  } else {
    // Lookup existing job context from database
    jobContext = await getJobContext(senderId);
    if (jobContext) {
      console.log('✅ Retrieved job context from DB:', jobContext);
    } else {
      console.log('⚠️ No job context found for sender');
    }
  }
  
  const webhookPayload = {
    type: 'messenger_message',
    timestamp: new Date().toISOString(),
    senderId: senderId,
    message: {
      text: event.message.text || '',
      attachments: event.message.attachments || []
    },
    jobContext: jobContext,
    isFirstMessage: isFirstMessage, // Flag for n8n
    source: 'facebook_messenger_message'
  };
  
  await sendToN8N(webhookPayload);
  console.log('📤 Message data sent to N8N');
}

// Handle button clicks (postbacks)
async function handlePostback(event, senderId) {
  console.log('📮 Postback received from:', senderId);
  console.log('🎯 Payload:', event.postback.payload);
  
  // Check if this postback also has referral data (first interaction)
  let jobContext = null;
  let isFirstMessage = false;

  if (event.postback.referral && event.postback.referral.ref) {
    console.log('🎯 Postback with referral data!');
    try {
      const decodedRef = JSON.parse(Buffer.from(event.postback.referral.ref, 'base64url').toString());
      jobContext = decodedRef;
      isFirstMessage = true;

      // Store in database
      await storeJobContext(senderId, decodedRef);
      console.log('✅ Job context from postback:', jobContext);
    } catch (error) {
      console.error('❌ Failed to decode postback referral:', error);
    }
  } else {
    // Lookup existing job context from database
    jobContext = await getJobContext(senderId);
    if (jobContext) {
      console.log('✅ Retrieved job context from DB:', jobContext);
    }
  }
  
  const webhookPayload = {
    type: 'messenger_postback',
    timestamp: new Date().toISOString(),
    senderId: senderId,
    postback: {
      title: event.postback.title,
      payload: event.postback.payload
    },
    jobContext: jobContext,
    isFirstMessage: isFirstMessage,
    source: 'facebook_messenger_postback'
  };
  
  await sendToN8N(webhookPayload);
  console.log('📤 Postback data sent to N8N');
}

// Store job context in database
async function storeJobContext(senderId, refData) {
  try {
    await prisma.jobContextSession.upsert({
      where: { senderId },
      update: {
        jobPostId: refData.jobPostId,
        jobTitle: refData.jobTitle,
        company: refData.company,
        lastMessageAt: new Date()
      },
      create: {
        senderId,
        jobPostId: refData.jobPostId,
        jobTitle: refData.jobTitle,
        company: refData.company,
        lastMessageAt: new Date()
      }
    });
    console.log('✅ Stored job context in database for sender:', senderId);
  } catch (error) {
    console.error('❌ Error storing job context:', error);
  }
}

// Get job context from database
async function getJobContext(senderId) {
  try {
    const session = await prisma.jobContextSession.findUnique({
      where: { senderId }
    });

    if (session) {
      // Update last message timestamp
      await prisma.jobContextSession.update({
        where: { senderId },
        data: { lastMessageAt: new Date() }
      });

      return {
        jobPostId: session.jobPostId,
        jobTitle: session.jobTitle,
        company: session.company
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error retrieving job context:', error);
    return null;
  }
}