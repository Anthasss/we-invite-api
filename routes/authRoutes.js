import express from 'express';
import { syncUser } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/sync-user
router.post('/sync-user', syncUser);

export default router;
