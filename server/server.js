import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express App
const app = express();
const server = http.createServer(app);

// Allow only your frontend domain (replace with your actual Vercel frontend URL)
const allowedOrigins = [
  "https://chat-howngpfjr-bhumees-projects-b0089f91.vercel.app"
];

// CORS Setup
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Optional: Set headers manually (extra protection)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigins[0]);
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Body parser
app.use(express.json({ limit: "4mb" }));

// Initialize socket.io
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins[0],
    credentials: true,
  },
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// API routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

// Start server locally (skip on Vercel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log("Server running on PORT:", PORT));
}

// Export for Vercel
export default server;
