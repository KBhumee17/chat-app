import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express App and HTTP server
const app = express();
const server = http.createServer(app);

// Define allowed origins first!
const allowedOrigins = [
  "https://chat-app-chi-sepia-57.vercel.app"
];

// Setup CORS for express
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


// Middleware
app.use(express.json({ limit: "4mb" }));

// Setup socket.io AFTER allowedOrigins is defined
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Online users map
export const userSocketMap = {};

// Socket.io logic
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// API Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to DB
await connectDB();

// Start server in dev or export for Vercel
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log("Server is running on PORT:" + PORT));
}

export default server;
