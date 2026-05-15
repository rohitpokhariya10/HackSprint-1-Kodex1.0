const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { getAccessTokenSecret } = require("../utils/tokens");

const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

const attachUserFromToken = async (req, token) => {
  const decoded = jwt.verify(token, getAccessTokenSecret());
  const user = await userModel.findById(decoded.userId);

  if (!user) {
    return null;
  }

  return user;
};

// Middleware ka kaam:
// 1. Cookie ya header se accessToken lena
// 2. Token verify karna
// 3. Token se userId nikalna
// 4. DB se user find karna
// 5. req.user me user attach karna
const authMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    // 3. Agar token missing hai
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Access token missing.",
      });
    }

    const user = await attachUserFromToken(req, token);

    // 5. Agar user DB me nahi mila
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User not found.",
      });
    }

    // 6. Agar account disabled hai
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled.",
      });
    }

    // 7. Logged-in user ko request object me attach kar do
    req.user = user;

    // 8. Next controller pe bhejo
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token.",
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next();
    }

    const user = await attachUserFromToken(req, token);

    if (user && user.isActive) {
      req.user = user;
    }

    return next();
  } catch (error) {
    return next();
  }
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
