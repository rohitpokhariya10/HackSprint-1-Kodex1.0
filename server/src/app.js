const express = require("express")
const cors = require("cors");
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.route")
const profileRoutes = require("./routes/profile.routes");
const projectRoutes = require("./routes/project.routes");
const blogRoutes = require("./routes/blog.routes");



const app = express()


app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173/",
  credentials: true
}))

app.use("/api/auth", authRouter)
app.use("/api/profiles", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/blogs", blogRoutes);

module.exports = app