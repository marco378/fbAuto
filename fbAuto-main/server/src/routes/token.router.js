import express from 'express';
import { 
  generateBookmarkletToken, 
  validateToken, 
  getTokenInfo 
} from '../controllers/token.controller.js';

const router = express.Router();

/**
 * Public endpoint to generate a fresh token for bookmarklet automation
 * GET /api/token/generate-bookmarklet
 */
router.get('/generate-bookmarklet', generateBookmarkletToken);

/**
 * Validate if a token is still valid
 * GET /api/token/validate
 * Headers: Authorization: Bearer <token>
 * Or: GET /api/token/validate?token=<token>
 */
router.get('/validate', validateToken);

/**
 * Get token information (for debugging)
 * GET /api/token/info
 * Headers: Authorization: Bearer <token>
 * Or: GET /api/token/info?token=<token>
 */
router.get('/info', getTokenInfo);

export default router;