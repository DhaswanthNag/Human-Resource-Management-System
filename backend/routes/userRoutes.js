const { Router } = require('express');
const {
  createUser,
  viewUser,
  listUsers,
  updateUserDetails,
  deleteUserAccount,
  getTotalUsers,
  shareCredentials,
  getTotalEmployees,
  getTotalHR
} = require('../controllers/userControllers');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const router = Router();

router.post('/add', authenticateToken, authorizeRoles("admin"), createUser);
router.get('/all', authenticateToken, authorizeRoles("admin"), listUsers);
router.get('/total', authenticateToken, authorizeRoles("admin"), getTotalUsers);
router.get('/total-employees', authenticateToken, authorizeRoles("admin"), getTotalEmployees);
router.get('/total-hr', authenticateToken, authorizeRoles("admin"), getTotalHR);
router.get('/:userId', authenticateToken, authorizeRoles("admin"), viewUser);
router.put('/:userId', authenticateToken, authorizeRoles("admin"), updateUserDetails);
router.delete('/:userId', authenticateToken, authorizeRoles("admin"), deleteUserAccount);
router.post('/:userId/share-credentials', authenticateToken, authorizeRoles("admin"), shareCredentials);

module.exports = router;
