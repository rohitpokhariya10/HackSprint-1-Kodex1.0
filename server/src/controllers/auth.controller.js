const userModel = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokens");
const jwt = require("jsonwebtoken")

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
});

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.refreshToken;
  return safeUser;
};

const sendLoggedOutSession = (res) => {
  return res.status(200).json({
    success: true,
    authenticated: false,
    message: "No active session",
    data: null,
    user: null,
  });
};

const rotateSessionFromRefreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    return null;
  }

  const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_TOKEN);
  const user = await userModel.findById(decoded.userId).select("+refreshToken");

  if (!user || !user.isActive || incomingRefreshToken !== user.refreshToken) {
    return null;
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie("accessToken", newAccessToken, getCookieOptions(60 * 60 * 1000));
  res.cookie("refreshToken", newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

  return user;
};

//registered
const registerController = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    email = String(email).trim().toLowerCase();

    let isExisted = await userModel.findOne({ email });

    if (isExisted) {
      return res.status(409).json({
        success: false,
        message: "This email alredy exist.",
      });
    }

    let hashed = await hashPassword(password);

    let newUser = await userModel.create({
      name,
      email,
      password:hashed,
    });

    let accessToken = generateAccessToken(newUser._id);
    let refreshToken = generateRefreshToken(newUser._id);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("accessToken", accessToken, getCookieOptions(60 * 60 * 1000));

    res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(201).json({
      success: true,
      message: "User create successfully.",
      data: sanitizeUser(newUser),
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    console.log("Error from backend api", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

//logged in
const loggedInController = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    email = String(email).trim().toLowerCase();

    //Database me is email wala user dhundo, aur uske saath hidden fields password aur refreshToken bhi le aao.
    const isExisted = await userModel
      .findOne({ email })
      .select("+password +refreshToken");

    if (!isExisted) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //password compare
    let comparePass = await comparePassword(password , isExisted.password);
    if (!comparePass) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //generate access token
    let accesToken = generateAccessToken(isExisted._id);

    //generate refresh token
    let refreshToken = generateRefreshToken(isExisted._id);

    //refresh token save inside DB
    isExisted.refreshToken = refreshToken;
    await isExisted.save();

    //save refresh and access token inside cookie
    res.cookie("accessToken", accesToken, getCookieOptions(60 * 60 * 1000));

    res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      message: "User loggedIn successfully.",
      data: sanitizeUser(isExisted),
      user: sanitizeUser(isExisted),
    });
  } catch (err) {
    console.log("Error from backend api", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

//
// GET /api/auth/me
// Logged-in user ka data return karega
const getMeController = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      data: sanitizeUser(req.user),
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching current user.",
    });
  }
};

//
const getRefreshTokenController = async (req, res) => {
  try {
    // 1. Get refresh token from cookie
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // 2. Verify refresh token
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_TOKEN
    );

    // 3. Find user and explicitly select refreshToken
    const user = await userModel
      .findById(decoded.userId)
      .select("+refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // 4. Match incoming refresh token with DB refresh token
    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // 6. Save new refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // 7. Cookie options
    // 8. Set new access token cookie
    res.cookie("accessToken", newAccessToken, getCookieOptions(60 * 60 * 1000));

    // 9. Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.log("Refresh Token Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }
};

// GET /api/auth/session
// Silent frontend session check. Logged-out users get 200, so public pages stay console-clean.
const getSessionController = async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN);
        const user = await userModel.findById(decoded.userId);

        if (user && user.isActive) {
          return res.status(200).json({
            success: true,
            authenticated: true,
            message: "Active session fetched successfully",
            data: sanitizeUser(user),
            user: sanitizeUser(user),
          });
        }
      } catch (error) {
        // Expired access token can still be recovered from a valid refresh cookie below.
      }
    }

    const refreshedUser = await rotateSessionFromRefreshToken(req, res);

    if (!refreshedUser) {
      return sendLoggedOutSession(res);
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      message: "Active session refreshed successfully",
      data: sanitizeUser(refreshedUser),
      user: sanitizeUser(refreshedUser),
    });
  } catch (error) {
    return sendLoggedOutSession(res);
  }
};

//
const logoutController = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
      await userModel.findOneAndUpdate(
        { refreshToken: incomingRefreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    const cookieOptions = getClearCookieOptions();
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    console.error("Logout error:", err);

    const cookieOptions = getClearCookieOptions();
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
};
module.exports = {
  registerController,
  loggedInController,
  getMeController,
  getSessionController,
  getRefreshTokenController,
  logoutController
};
