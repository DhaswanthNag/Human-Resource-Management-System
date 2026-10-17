import express from "express";
import employeeController from "../controllers/employeeController.js";
import documentController from "../controllers/documentController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();


router.post("/", employeeController.createEmployee);
router.get("/", employeeController.getEmployees);
router.get("/with-docs", employeeController.getEmployeesWithDocuments);
router.put("/:empId/decision", employeeController.updateEmployeeDecision);
router.put("/approve/:empId", employeeController.approveEmployee);
router.put("/reject/:empId", employeeController.rejectEmployee);
router.delete("/:empId", employeeController.deleteEmployee);



router.post("/:empId/documents", upload.single("file"), documentController.uploadDocument);
router.get("/:empId/documents", documentController.getEmployeeDocuments);
router.get("/raw/:docId", documentController.getRawDocument);
// router.put("/documents/status/:docId", documentController.updateDocumentStatus);
router.put("/status/:docId", documentController.updateDocumentStatus);
router.delete("/documents/:docId", documentController.deleteDocument);


export default router;
