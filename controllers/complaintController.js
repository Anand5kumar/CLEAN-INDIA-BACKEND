import ComplaintModel from '../models/Complaint.js';
import { uploadImageToCloudinary, uploadVideoToCloudinary } from '../utils/cloudinary.js';

// Submit a new complaint
export const submitComplaint = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, lat, lng, address } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    if (!name || !phone || !lat || !lng) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Upload image to Cloudinary
    const imageResult = await uploadImageToCloudinary(req.file.buffer);

    // Create complaint
    const complaint = new ComplaintModel({
      user: userId,
      image: imageResult.secure_url,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      address: address || '',
      name,
      phone
    });

    await complaint.save();

    // Populate user details for response
    await complaint.populate('user', 'name email');

    res.json({
      success: true,
      message: "Complaint submitted successfully",
      complaint
    });

  } catch (error) {
    console.error("Submit complaint error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// Get user's complaint history
export const getComplaintHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const complaints = await ComplaintModel.find({ user: userId })
      .sort({ submittedAt: -1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      complaints
    });

  } catch (error) {
    console.error("Get complaint history error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// Upload proof video for a complaint
export const uploadProof = async (req, res) => {
  try {
    const userId = req.userId;
    const { complaintId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Video is required" });
    }

    if (!complaintId) {
      return res.status(400).json({ success: false, message: "Complaint ID is required" });
    }

    // Check if complaint exists and belongs to user
    const complaint = await ComplaintModel.findOne({ _id: complaintId, user: userId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Upload video to Cloudinary
    const videoResult = await uploadVideoToCloudinary(req.file.buffer);

    // Update complaint with proof video and mark as resolved
    complaint.proofVideo = videoResult.secure_url;
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();

    await complaint.save();

    res.json({
      success: true,
      message: "Proof uploaded successfully",
      complaint
    });

  } catch (error) {
    console.error("Upload proof error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// Get single complaint by ID
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const complaint = await ComplaintModel.findOne({ _id: id, user: userId })
      .populate('user', 'name email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({
      success: true,
      complaint
    });

  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};