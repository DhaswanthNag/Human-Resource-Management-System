import {
  createTaskModel,
  getTasksModel,
  getTasksByAssignedToModel,
  updateTaskModel,
  deleteTaskModel,
  getTaskStatsModel,
} from "../models/taskModel.js";

// Create a task
export const createTaskController = async (req, res) => {
  try {
    const task = await createTaskModel(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
};

// Get all tasks or filter by employee
export const getTasksController = async (req, res) => {
  try {
    const { assignedTo } = req.query;
    let tasks;
    if (assignedTo) {
      tasks = await getTasksByAssignedToModel(assignedTo);
    } else {
      tasks = await getTasksModel();
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Update a task
export const updateTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await updateTaskModel(id, req.body);
    if (!updatedTask) return res.status(404).json({ error: "Task not found" });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
};

// Delete a task
export const deleteTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await deleteTaskModel(id);
    if (!deletedTask) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully", deletedTask });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// Get task stats
export const getStatsController = async (req, res) => {
  try {
    const stats = await getTaskStatsModel();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
