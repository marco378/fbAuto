// routes/n8n.route.js - N8N Integration Routes
import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Get job context by session ID (for n8n to get job details)
router.get('/job-context/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Find the job context by session ID or create a default one
    let jobContext = await prisma.jobContext.findFirst({
      where: { sessionId },
      include: {
        job: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        }
      }
    });

    if (!jobContext) {
      // Return a default job context if none found
      jobContext = {
        sessionId,
        contextData: {
          jobTitle: "Software Developer",
          company: "Tech Company",
          location: "Remote",
          jobType: "Full-time",
          salaryRange: "£50,000 - £70,000",
          requirements: [
            "3+ years of JavaScript experience",
            "React.js proficiency",
            "Node.js backend experience",
            "Database knowledge (SQL/NoSQL)"
          ],
          description: "We are looking for a talented software developer to join our team.",
          perks: ["Remote work", "Health insurance", "Professional development budget"]
        }
      };
    }

    res.json({
      success: true,
      jobContext
    });
  } catch (error) {
    console.error('❌ Error getting job context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job context'
    });
  }
});

// Save candidate data from n8n
router.post('/candidates', async (req, res) => {
  try {
    const candidateData = req.body;
    
    // Save or update candidate in database
    const candidate = await prisma.candidate.upsert({
      where: { 
        senderId: candidateData.senderId || `n8n_${Date.now()}`
      },
      update: {
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        experience: candidateData.experience,
        skills: candidateData.skills || [],
        resumeUrl: candidateData.resumeUrl,
        notes: candidateData.notes,
        conversationSummary: candidateData.conversationSummary,
        screeningScore: candidateData.screeningScore,
        keyStrengths: candidateData.keyStrengths || [],
        concerns: candidateData.concerns || [],
        eligibility: candidateData.eligibility || 'PENDING',
        messengerConversation: candidateData.messengerConversation || [],
        updatedAt: new Date()
      },
      create: {
        senderId: candidateData.senderId || `n8n_${Date.now()}`,
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        experience: candidateData.experience,
        skills: candidateData.skills || [],
        resumeUrl: candidateData.resumeUrl,
        notes: candidateData.notes,
        conversationSummary: candidateData.conversationSummary,
        screeningScore: candidateData.screeningScore,
        keyStrengths: candidateData.keyStrengths || [],
        concerns: candidateData.concerns || [],
        eligibility: candidateData.eligibility || 'PENDING',
        messengerConversation: candidateData.messengerConversation || [],
        createdAt: new Date()
      }
    });

    res.json({
      success: true,
      candidate,
      message: 'Candidate saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving candidate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save candidate'
    });
  }
});

// Save conversation history from n8n
router.post('/conversations', async (req, res) => {
  try {
    const { senderId, message, aiResponse, sessionId } = req.body;
    
    // Save conversation to database
    const conversation = await prisma.conversation.create({
      data: {
        senderId,
        userMessage: message,
        aiResponse,
        sessionId,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      conversation,
      message: 'Conversation saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save conversation'
    });
  }
});

// Get conversation history for a sender
router.get('/conversations/:senderId', async (req, res) => {
  try {
    const { senderId } = req.params;
    
    const conversations = await prisma.conversation.findMany({
      where: { senderId },
      orderBy: { timestamp: 'asc' },
      take: 50 // Last 50 messages
    });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});

// N8N webhook endpoint for receiving data
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('📥 Received N8N webhook:', JSON.stringify(webhookData, null, 2));
    
    // Process webhook data based on type
    if (webhookData.type === 'candidate_completed') {
      // Handle completed candidate screening
      await prisma.candidate.update({
        where: { senderId: webhookData.senderId },
        data: {
          eligibility: webhookData.eligibility,
          screeningScore: webhookData.screeningScore,
          conversationSummary: webhookData.summary
        }
      });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('❌ Error processing N8N webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

export default router;