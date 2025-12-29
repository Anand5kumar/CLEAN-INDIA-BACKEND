import express from 'express';
import userAuth from '../middleware/userAuth.js';
import {
  submitComplaint,
  getComplaintHistory,
  uploadProof,
  getComplaintById
} from '../controllers/complaintController.js';
import { upload } from '../middleware/multer.js';

const complaintRouter = express.Router();

// Submit complaint with image upload
complaintRouter.post('/submit', userAuth, upload.single('image'), submitComplaint);

// Get user's complaint history
complaintRouter.get('/history', userAuth, getComplaintHistory);

// Upload proof video
complaintRouter.post('/upload-proof', userAuth, upload.single('video'), uploadProof);

// Get specific complaint
complaintRouter.get('/:id', userAuth, getComplaintById);

export default complaintRouter;