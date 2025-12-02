const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/signup', dataController.signup);
router.get('/users', authMiddleware, adminMiddleware, dataController.getUsers);
router.post('/auth/google', dataController.googleAuth);
router.get('/timer', dataController.getTimer);

//SignUp Route
router.post('/signup', dataController.signup);

module.exports = router;