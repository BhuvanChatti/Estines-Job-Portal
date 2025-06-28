import userModels from "../models/userModels.js";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: 'bhuvanchattiproject@gmail.com',
        pass: 'shhd honu hhvm bwmd'
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
            console.log('Email sent:', info);
        }
    });
};
export const registerC = async (req, res, next) => {

    const { name, email, password, lastName, location } = req.body;
    if (!name) {
        return next("Name not given, Provide a name");
    }
    if (!email) {
        return next("Email is not given, provide Email");
    }
    if (!password) {
        return next('Password is not given, provide Password');
    }
    const euser = await userModels.findOne({ email })

    if (euser) {
        sendEmail(euser.email, 'Re-register attempt', 'There was a register attempt. You are an exisiting user kindly login at https://estines-job-portal-main-3.onrender.com');
        return next('User exists, please login');
    }
    const user = await userModels.create({ name, email, password, lastName, location });
    const token = user.createjwt();
    sendEmail(user.email, 'Welcome to Our Estines Job Board', 'Thank you for registering!');
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
        console.log("User found:", user);
        const isMatch = await user.compareP(password);
        console.log("Password match:", isMatch);
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
