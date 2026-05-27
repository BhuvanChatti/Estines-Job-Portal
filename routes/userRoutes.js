import express from 'express';
import userAuth from '../middelwares/authmware.js';
import { getUserController, updateUserController, changePasswordController } from '../controllers/userController.js';
const router = express.Router();
router.post('/getUser', userAuth, getUserController)
router.put('/update-user', userAuth, updateUserController)
router.put('/change-password', userAuth, changePasswordController)
export default router; 