import userModels from "../models/userModels.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
export const registerC = async (req, res, next) => {
    try {
        const { name, email, password, lastName, location, type } = req.body;
        if (!name) return next("Name not given, Provide a name");
        if (!email) return next("Email is not given, provide Email");
        if (!password) return next('Password is not given, provide Password');
        if (type !== "Applicant" && type !== "Recruiter") return next("User type must be 'Applicant' or 'Recruiter'");

        const euser = await userModels.findOne({ email });
        if (euser) {
            sendEmail(euser.email, 'Re-register attempt', 'There was a register attempt. You are an existing user, kindly login at https://estines-job-portal-main-3.onrender.com');
            return next('User exists, please login');
        }

        const user = await userModels.create({ name, email, password, lastName, location, type });
        const token = user.createjwt();
        sendEmail(user.email, 'Welcome to Estines', 'Thank you for registering!');
        res.status(201).send({
            success: true,
            message: 'User Created Successfully',
            user: { name: user.name, lastName: user.lastName, email: user.email, location: user.location, userType: user.type },
            token,
        });
    } catch (error) {
        next(error);
    }
};
export const sendOtpController = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next('Email is required');
        const user = await userModels.findOne({ email });
        if (!user) return next('No account found with this email');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        user.otpHash = otpHash;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otpVerified = false;
        await user.save();

        await sendEmail(email, 'Your OTP – Estines', `Your OTP is: ${otp}\n\nValid for 10 minutes. Do not share this with anyone.`);
        res.status(200).json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        next(error);
    }
};

export const verifyOtpController = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return next('Email and OTP are required');
        const user = await userModels.findOne({ email }).select('+otpHash');
        if (!user || !user.otpHash) return next('Invalid or expired OTP');
        if (user.otpExpiry < new Date()) return next('OTP has expired. Request a new one.');

        const isValid = await bcrypt.compare(otp, user.otpHash);
        if (!isValid) return next('Incorrect OTP');

        user.otpVerified = true;
        await user.save();
        res.status(200).json({ success: true, message: 'OTP verified' });
    } catch (error) {
        next(error);
    }
};

export const resetPasswordController = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) return next('All fields are required');
        if (newPassword.length < 6) return next('Password must be at least 6 characters');

        const user = await userModels.findOne({ email });
        if (!user) return next('User not found');
        if (!user.otpVerified) return next('Please verify OTP first');

        user.password = newPassword;
        user.otpVerified = false;
        await user.save();
        await userModels.updateOne({ email }, { $unset: { otpHash: '', otpExpiry: '' } });

        await sendEmail(email, 'Password changed – Estines', 'Your Estines account password was successfully changed. If this was not you, contact support immediately.');
        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
};

export const loginC = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next('Provide required fields');
        }
        const user = await userModels.findOne({ email }).select("+password");
        if (!user) {
            return next('Invalid email or password');
        }
        const isMatch = await user.compareP(password);
        if (!isMatch) {
            return next('Wrong Password. Enter again');
        }
        user.password = undefined;
        const token = user.createjwt()
        const date = new Date();
        const currtime = date.toLocaleString();
        sendEmail(user.email, 'New login on Estines', `Youve logged into our site at ${currtime}`);
        res.status(200).json({
            success: true,
            messege: "Logged In successfully",
            user,
            token,
        })
    }
    catch (error) {
        console.error("Login error:", error);
        next(error);
    }
};
