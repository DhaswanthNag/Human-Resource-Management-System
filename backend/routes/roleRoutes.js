// routes/roleRoutes.js
const express = require("express");
const router = express.Router();
const RoleController = require("../controllers/roleController");

router.get("/", RoleController.getRoles);
router.get("/:id", RoleController.getRole);
router.post("/", RoleController.createRole);
router.put("/:id", RoleController.updateRole);
router.delete("/:id", RoleController.deleteRole);

module.exports = router;
