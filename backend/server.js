import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import { createServer } from "http";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import messageRoutes from "./routes/message.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
	cors: {
		origin: process.env.NODE_ENV !== "production" ? "http://localhost:5173" : undefined,
		credentials: true,
	}
});

// Store online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
	console.log("A user connected");

	socket.on("user_connected", (userId) => {
		onlineUsers.set(userId, socket.id);
		io.emit("user_status_change", Array.from(onlineUsers.keys()));
	});

	socket.on("private_message", ({ to, message, from }) => {
		const receiverSocket = onlineUsers.get(to);
		if (receiverSocket) {
			io.to(receiverSocket).emit("receive_message", {
				message,
				from
			});
		}
	});

	socket.on("typing", ({ to, from }) => {
		const receiverSocket = onlineUsers.get(to);
		if (receiverSocket) {
			io.to(receiverSocket).emit("user_typing", { from });
		}
	});

	socket.on("disconnect", () => {
		let userId;
		for (const [key, value] of onlineUsers.entries()) {
			if (value === socket.id) {
				userId = key;
				break;
			}
		}
		if (userId) {
			onlineUsers.delete(userId);
			io.emit("user_status_change", Array.from(onlineUsers.keys()));
		}
	});
});

if (process.env.NODE_ENV !== "production") {
	app.use(
		cors({
			origin: "http://localhost:5173",
			credentials: true,
		})
	);
}

app.use(express.json({ limit: "5mb" })); // parse JSON request bodies
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	connectDB();
});
