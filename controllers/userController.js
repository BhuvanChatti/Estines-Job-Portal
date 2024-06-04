import userModels from "../models/userModels.js";

export const updateUserController = async (req, res, next) => {
    const { name, email, lastName, location } = req.body
    if (!name || !email || !lastName || !location) {
        next('Please provide all Fields')
    }
    const user = await userModels.findOne({ _id: req.user.userId })
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
        const user = await userModels.findById({ _id: req.body.user.userId });
        user.password = undefined;
        if (!user) {
            return res.status(200).send({
                message: 'User Not Found',
                success: false
            })
        }
        else {
            res.status(200).send({
                success: true,
                data: user,
            })
        }
    } catch (error) {

        res.status(500).send({
            message: 'auth error',
            success: false,
            error: error.message
        })
    }
}