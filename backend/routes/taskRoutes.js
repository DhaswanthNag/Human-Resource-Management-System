import express from "express";
import {
  createTaskController,
  getTasksController,
  updateTaskController,
  deleteTaskController,
  getStatsController,
} from "../controllers/taskController.js";

const router = express.Router();

router.post("/", createTaskController);
router.get("/", getTasksController);
router.put("/:id", updateTaskController);
router.delete("/:id", deleteTaskController);
router.get("/stats", getStatsController);

export default router;