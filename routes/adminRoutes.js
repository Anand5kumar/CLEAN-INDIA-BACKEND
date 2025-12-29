import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  getDashboardStats,
  getAllUsers,
  getAllComplaints,
  updateComplaint,
  getComplaintById,
  deleteUser,
  getModerators,
  createModerator
} from '../controllers/adminController.js';

const adminRouter = express.Router();

// All routes require admin authentication
adminRouter.use(adminAuth);

// Dashboard
adminRouter.get('/dashboard/stats', getDashboardStats);

// Users management
adminRouter.get('/users', getAllUsers);
adminRouter.delete('/users/:id', deleteUser);

// Complaints management
adminRouter.get('/complaints', getAllComplaints);
adminRouter.get('/complaints/:id', getComplaintById);
adminRouter.put('/complaints/:id', updateComplaint);

// Moderators management
adminRouter.get('/moderators', getModerators);
adminRouter.post('/moderators', createModerator);

export default adminRouter;