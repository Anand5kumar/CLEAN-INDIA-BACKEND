import userModel from "../models/usermodel.js";
import ComplaintModel from "../models/Complaint.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments({ role: 'user' });
    const totalComplaints = await ComplaintModel.countDocuments();
    const pendingComplaints = await ComplaintModel.countDocuments({ status: 'pending' });
    const resolvedComplaints = await ComplaintModel.countDocuments({ status: 'resolved' });
    const inProgressComplaints = await ComplaintModel.countDocuments({ status: 'in-progress' });

    // Recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentComplaints = await ComplaintModel.countDocuments({
      submittedAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        inProgressComplaints,
        recentComplaints
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with pagination and search
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await userModel.find(query)
      .select('-password -verifyOtp -resetOtp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await userModel.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: parseInt(page),
      totalUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all complaints with filters
export const getAllComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search = '',
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search in name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const complaints = await ComplaintModel.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .populate('updatedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalComplaints = await ComplaintModel.countDocuments(query);

    res.json({
      success: true,
      complaints,
      totalPages: Math.ceil(totalComplaints / limit),
      currentPage: parseInt(page),
      totalComplaints
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update complaint status and add admin notes
export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, priority, assignedTo } = req.body;

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const updateData = {
      updatedBy: req.userId
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }
    }

    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const updatedComplaint = await ComplaintModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'name email')
     .populate('assignedTo', 'name')
     .populate('updatedBy', 'name');

    res.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get complaint by ID for admin
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await ComplaintModel.findById(id)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('updatedBy', 'name');

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin users
    const user = await userModel.findById(id);
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: "Cannot delete admin user" });
    }

    await userModel.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "User deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get moderators list
export const getModerators = async (req, res) => {
  try {
    const moderators = await userModel.find({
      $or: [{ role: 'admin' }, { role: 'moderator' }]
    }).select('-password');

    res.json({
      success: true,
      moderators
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create moderator
export const createModerator = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // In a real application, you would hash the password
    const newModerator = new userModel({
      name,
      email,
      password, // You should hash this password
      role: role || 'moderator',
      isAccountVerified: true
    });

    await newModerator.save();

    res.json({
      success: true,
      message: "Moderator created successfully",
      moderator: {
        id: newModerator._id,
        name: newModerator.name,
        email: newModerator.email,
        role: newModerator.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};