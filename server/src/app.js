const express = require("express")
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.route")
const profileRoutes = require("./routes/profile.routes");

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/profiles", profileRoutes);



module.exports = app