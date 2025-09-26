import {
  createTaskModel,
  getTasksModel,
  updateTaskModel,
  deleteTaskModel,
  getTaskStatsModel,
} from "../models/taskModel.js";

export const createTaskController = async (req, res) => {
  try {
    const task = await createTaskModel(req.body);
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const getTasksController = async (req, res) => {
  try {
    const tasks = await getTasksModel();
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const updateTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await updateTaskModel(id, req.body);
    if (!updatedTask) return res.status(404).json({ error: "Task not found" });
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await deleteTaskModel(id);
    if (!deletedTask) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully", deletedTask });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

export const getStatsController = async (req, res) => {
  try {
    const stats = await getTaskStatsModel();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};