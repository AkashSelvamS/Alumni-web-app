import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/:userId", protectRoute, getMessages);
router.post("/", protectRoute, sendMessage);
router.put("/:messageId/read", protectRoute, markMessageAsRead);

export default router; 