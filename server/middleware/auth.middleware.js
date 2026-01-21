import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Token decoded successfully:", {
      id: decoded.id,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toLocaleString()
    });

    // 4. ✅ FIX: Fetch user from database to ensure role is current
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      console.error("❌ User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User found in DB:", {
      id: user._id,
      role: user.role,
      email: user.email
    });

    // 5. Set req.user with data from database (not just token)
    req.user = {
      _id: user._id,
      role: user.role,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;