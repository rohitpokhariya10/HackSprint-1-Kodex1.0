const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

// Middleware ka kaam:
// 1. Cookie ya header se accessToken lena
// 2. Token verify karna
// 3. Token se userId nikalna
// 4. DB se user find karna
// 5. req.user me user attach karna
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Cookie se accessToken lo
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Optional: Authorization header se token lo
    // Example: Authorization: Bearer token_here
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 3. Agar token missing hai
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Access token missing.",
      });
    }

    // 4. Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);

    // Tum token generate karte time { userId } bhej rahe ho
    // Isliye decoded.userId use karenge
    const user = await userModel.findById(decoded.userId);

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

module.exports = authMiddleware;