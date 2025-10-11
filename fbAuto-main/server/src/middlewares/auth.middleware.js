import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../credentials.js";

export const verifyToken = async (req, res, next) => {
  try {
    // Check for token in cookies first, then Authorization header
    let token = req.cookies.token;
    
    // If no cookie token, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }
    
    console.log("token", token ? `${token.substring(0, 20)}...` : 'none');
    
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded user to request for later use
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
