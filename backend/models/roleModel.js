// backend/models/roleModel.js
const db = require("../config/db");

const RoleModel = {
  async getAll() {
    const result = await db.query("SELECT * FROM roles ORDER BY id ASC");
    return result.rows;
  },

  async getById(id) {
    const result = await db.query("SELECT * FROM roles WHERE id = $1", [id]);
    return result.rows[0];
  },

  async create({ name, description, permissions }) {
    // Cast JS array into Postgres text[]
    const result = await db.query(
      "INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *",
      [name, description, permissions]
    );
    return result.rows[0];
  },

  async update(id, { name, description, permissions }) {
    const result = await db.query(
      `UPDATE roles
       SET name=$1, description=$2, permissions=$3
       WHERE id=$4 RETURNING *`,
      [name, description, permissions, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query("DELETE FROM roles WHERE id = $1", [id]);
  },
};

module.exports = RoleModel;
