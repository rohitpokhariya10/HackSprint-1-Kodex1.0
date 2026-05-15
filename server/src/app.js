const express = require("express")
const cors = require("cors");
const cookieParser = require("cookie-parser")
const path = require("path");
const authRouter = require("./routes/auth.route")
const profileRoutes = require("./routes/profile.routes");
const projectRoutes = require("./routes/project.routes");
const blogRoutes = require("./routes/blog.routes");
const { uploadsRoot } = require("./services/localUpload.service");



const app = express()

app.set("trust proxy", 1);

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const frontendPath = path.join(__dirname, "..", "view");
const frontendIndexPath = path.join(frontendPath, "index.html");

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))
app.use(cookieParser())
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}))

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "DevHub API is running",
  });
});

app.use("/api/auth", authRouter)
app.use("/api/profiles", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/blogs", blogRoutes);

app.use("/uploads", express.static(uploadsRoot));
app.use(express.static(frontendPath));

app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
  return res.sendFile(frontendIndexPath, (error) => {
    if (error) return next();
  });
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error.message);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.publicMessage || "Internal server error",
  });
});

module.exports = app
