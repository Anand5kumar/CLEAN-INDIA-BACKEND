import jwt from 'jsonwebtoken';
import userModel from '../models/usermodel.js';

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }

    req.userId = decoded.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default adminAuth;