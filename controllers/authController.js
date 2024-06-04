import userModels from "../models/userModels.js";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'bhuvanchatti579@gmail.com',
        pass: 'akshitha@135'
    }
});

// Function to send email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: 'bhuvanchatti579@gmail.com',
        to: to,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {

        }
    });
};
export const registerC = async (req, res, next) => {

    const { name, email, password, lastName, location } = req.body;
    if (!name) {
        next("Name not given, Provide a name");
    }
    if (!email) {
        next("Email is not given, provide Email");
    }
    if (!password) {
        next('Password is not given, provide Password');
    }
    const euser = await userModels.findOne({ email })

    if (euser) {
        next('User already exists ,Please login');
    }
    const user = await userModels.create({ name, email, password, lastName, location });
    const token = user.createjwt();
    sendEmail(user.email, 'Welcome to Our Site', 'Thank you for registering!');
    res.status(201).send({
        success: true,
        message: 'User Created Successfully',
        user: {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            location: user.location,
        },
        token,
    });
};
export const loginC = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        next('Provide required fields');
    }
    const user = await userModels.findOne({ email }).select("+password");
    if (!user) {
        next('Invalid email or password')
    }
    const isMatch = await user.compareP(password);
    if (!isMatch) {
        next("Invalid user name or Password"); zz
    }
    user.password = undefined;
    const token = user.createjwt()
    res.status(200).json({
        success: true,
        messege: "Logged In successfully",
        user,
        token,
    })
};