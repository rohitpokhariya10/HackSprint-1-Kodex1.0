const express = require("express")
const { registerController, loggedInController, getMeController, getRefreshTokenController, logoutController } = require("../controllers/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")


const router = express.Router()

router.post("/register", registerController)
router.post("/login", loggedInController)

// Protected route
router.get("/me", authMiddleware, getMeController);

//generate refresh token
router.post("/refresh-token" , getRefreshTokenController)
//logout
router.post("/logout", authMiddleware, logoutController)
module.exports = router