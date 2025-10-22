import express from 'express';
import { 
  createTransaction, 
  handleNotification, 
  getTransactionStatus 
} from '../controllers/midtransController.js';

const router = express.Router();

// POST /api/midtrans/create-transaction - Create a new payment transaction
router.post('/create-transaction', createTransaction);

// POST /api/midtrans/notification - Handle Midtrans webhook notifications
router.post('/notification', handleNotification);

// GET /api/midtrans/status/:orderId - Get transaction status
router.get('/status/:orderId', getTransactionStatus);

export default router;
