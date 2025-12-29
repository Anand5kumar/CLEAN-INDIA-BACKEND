import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  image: {
    type: String, // Cloudinary URL
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  address: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  proofVideo: {
    type: String, // Cloudinary URL for proof video
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
});

// Index for better query performance
complaintSchema.index({ status: 1, submittedAt: -1 });
complaintSchema.index({ user: 1, submittedAt: -1 });

const ComplaintModel = mongoose.models.complaint || mongoose.model('complaint', complaintSchema);

export default ComplaintModel;