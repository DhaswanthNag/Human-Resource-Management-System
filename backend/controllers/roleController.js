// controllers/roleController.js
const db = require('../config/db');
const RoleModel = require("../models/roleModel");

const RoleController = {
  async getRoles(req, res) {
    try {
      const roles = await RoleModel.getAll();
      res.json(roles);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getRole(req, res) {
    try {
      const role = await RoleModel.getById(req.params.id);
      if (!role) return res.status(404).json({ error: "Role not found" });
      res.json(role);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createRole(req, res) {
    try {
      const { name, description, permissions } = req.body;
      const role = await RoleModel.create({ name, description, permissions });
      res.status(201).json(role);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateRole(req, res) {
    try {
      const { name, description, permissions } = req.body;
      const role = await RoleModel.update(req.params.id, {
        name,
        description,
        permissions,
      });
      if (!role) return res.status(404).json({ error: "Role not found" });
      res.json(role);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteRole(req, res) {
    try {
      await RoleModel.delete(req.params.id);
      res.json({ message: "Role deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = RoleController;
