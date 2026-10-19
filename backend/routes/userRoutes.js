const { Router } = require('express');
const bcrypt = require('bcrypt');
const {
  createUser,
  viewUser,
  listUsers,
  updateUserDetails,
  deleteUserAccount,
  getTotalUsers,
  shareCredentials,
  getTotalEmployees,
  getTotalHR,
  getMyProfile,
  updateMyProfile
} = require('../controllers/userControllers');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/authMiddleware');
const {
  resetUserPassword,
  changeUserPassword
} = require('../models/userModel');

const {
  updateHeartbeat,
  isUserOnline
} = require('../utils/presenceStore');

const router = Router();

router.post('/add', authenticateToken, authorizeRoles("admin"), createUser);
router.get('/all', authenticateToken, authorizeRoles("admin"), listUsers);
router.get('/total', authenticateToken, authorizeRoles("admin"), getTotalUsers);
router.get('/total-employees', authenticateToken, authorizeRoles("admin"), getTotalEmployees);
router.get('/total-hr', authenticateToken, authorizeRoles("admin"), getTotalHR);

// Logged-in users fetch and update only their own profile.
router.get(
  '/profile/me',
  authenticateToken,
  authorizeRoles("admin", "hr", "employee"),
  getMyProfile
);

router.put(
  '/profile/me',
  authenticateToken,
  authorizeRoles("admin", "hr", "employee"),
  updateMyProfile
);

// Admin resets a user's password.
router.post(
  '/:userId/reset-password',
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await resetUserPassword(userId);

      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({
        message: 'Password reset successfully',
        userId: result.userId,
        temporaryPassword: result.temporaryPassword
      });
    } catch (error) {
      console.error('Admin password reset error:', error.message);
      return res.status(500).json({ message: 'Unable to reset password' });
    }
  }
);

// Logged-in user changes their own password.
router.post(
  '/change-password',
  authenticateToken,
  authorizeRoles("admin", "hr", "employee"),
  async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.user_id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          message: 'Unable to identify logged-in user'
        });
      }

      if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        currentPassword.length === 0 ||
        newPassword.length < 8
      ) {
        return res.status(400).json({
          message: 'Current password is required and new password must be at least 8 characters'
        });
      }

      const result = await changeUserPassword(
        userId,
        currentPassword,
        newPassword
      );

      if (!result.success) {
        const status = result.message === 'User not found' ? 404 : 400;
        return res.status(status).json({ message: result.message });
      }

      return res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error.message);
      return res.status(500).json({ message: 'Unable to change password' });
    }
  }
);

// Update the logged-in user's online status.
router.post(
  '/presence/heartbeat',
  authenticateToken,
  authorizeRoles('admin', 'hr', 'employee'),
  (req, res) => {
    updateHeartbeat(req.user.userId, req.user.role);
    return res.status(200).json({ online: true });
  }
);

// Check the logged-in user's current online status.
router.get(
  '/presence/me',
  authenticateToken,
  authorizeRoles('admin', 'hr', 'employee'),
  (req, res) => {
    return res.status(200).json({
      online: isUserOnline(req.user.userId, req.user.role)
    });
  }
);

// Fetch HR/Admin accounts for the interview assignment dropdown.
router.get(
  '/interviewers',
  authenticateToken,
  authorizeRoles("admin", "hr"),
  async (req, res) => {
    try {
      const db = require('../config/db');
      const result = await db.query(`
        SELECT user_id, name, role
        FROM public.users
        WHERE LOWER(TRIM(role)) IN ('admin', 'hr')
        ORDER BY user_id ASC
      `);

      return res.status(200).json({ users: result.rows });
    } catch (error) {
      console.error('Error fetching interviewers:', error);
      return res.status(500).json({
        error: 'Unable to fetch interviewers'
      });
    }
  }
);

router.get('/:userId', authenticateToken, authorizeRoles("admin"), viewUser);
router.put('/:userId', authenticateToken, authorizeRoles("admin"), updateUserDetails);
router.delete('/:userId', authenticateToken, authorizeRoles("admin"), deleteUserAccount);
router.post('/:userId/share-credentials', authenticateToken, authorizeRoles("admin"), shareCredentials);

module.exports = router;