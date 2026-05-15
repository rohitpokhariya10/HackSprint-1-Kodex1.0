const userModel = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokens");
const jwt = require("jsonwebtoken")
//registered
const registerController = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    let isExisted = await userModel.findOne({ email });

    if (isExisted) {
      return res.status(409).json({
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

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User create successfully.",
      user: newUser,
    });
  } catch (err) {
    console.log("Error from backend api", err);
    return res.status(500).json({
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
        message: "All fields are required.",
      });
    }
    //Database me is email wala user dhundo, aur uske saath hidden fields password aur refreshToken bhi le aao.
    const isExisted = await userModel
      .findOne({ email })
      .select("+password +refreshToken");

    if (!isExisted) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    //password compare
    let comparePass = await comparePassword(password , isExisted.password);
    if (!comparePass) {
      return res.status(401).json({
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
    res.cookie("accessToken", accesToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "User loggedIn successfully.",
      user: isExisted,
    });
  } catch (err) {
    console.log("Error from backend api", err);
    return res.status(500).json({
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
      user: req.user,
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
        message: "Refresh token missing. Please login again.",
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
        message: "Invalid refresh token. User not found.",
      });
    }

    // 4. Match incoming refresh token with DB refresh token
    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired or already used. Please login again.",
      });
    }

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // 6. Save new refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // 7. Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    // 8. Set new access token cookie
    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // 9. Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.log("Refresh Token Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token. Please login again.",
    });
  }
};

//
const logoutController = async (req, res) => {
  try {

    // user refresh token remove from DB
    await userModel.findByIdAndUpdate(
      req.user._id,
      {
        refreshToken: "",
      },
      {
        new: true,
      }
    );

    // cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    // clear cookies
    res.clearCookie("accessToken", cookieOptions);

    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      message: "User logged out successfully.",
    });

  } catch (err) {
    console.log("Error from backend api", err);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
module.exports = {
  registerController,
  loggedInController,
  getMeController,
  getRefreshTokenController,
  logoutController
};
