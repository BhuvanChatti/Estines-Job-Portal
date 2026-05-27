import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email error:', error.message);
    }
};

export default sendEmail;
