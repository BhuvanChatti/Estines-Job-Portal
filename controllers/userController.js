import userModels from "../models/userModels.js";

export const changePasswordController = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return next('All fields are required');
        if (newPassword.length < 6) return next('New password must be at least 6 characters');

        const user = await userModels.findById(req.body.user.userId).select('+password');
        if (!user) return next('User not found');

        const isMatch = await user.compareP(currentPassword);
        if (!isMatch) return next('Current password is incorrect');

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateUserController = async (req, res, next) => {
    const { name, email, lastName, location } = req.body
    if (!name || !email || !lastName || !location) {
        return next('Please provide all Fields')
    }
    const user = await userModels.findOne({ _id: req.body.user.userId })
    user.name = name
    user.lastName = lastName
    user.email = email
    user.location = location
    await user.save()
    const token = user.createjwt()
    res.status(200).json({
        user,
        token,
    });
};
export const getUserController = async (req, res, next) => {
    try {
        const user = await userModels.findById(req.body.user.userId);
        if (!user) {
            return res.status(404).send({
                message: 'User Not Found',
                success: false
            })
        }
        user.password = undefined;
        res.status(200).send({
            success: true,
            data: user,
        })
    } catch (error) {

        res.status(500).send({
            message: 'auth error',
            success: false,
            error: error.message
        })
    }
}