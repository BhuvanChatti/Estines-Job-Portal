import mongoose from "mongoose";
import validate from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is Required']
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        unique: true,
        validate: validate.isEmail
    },
    password: {
        type: String,
        required: [true, 'Password is Required'],
        minlength: [6, "Length should be greater than 8 charecters"],
        select: false,
    },
    location: {
        type: String,
        default: 'India'
    }
}, { timestamps: true });
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.compareP = async function (up) {
    const isMatch = await bcrypt.compare(up, this.password);
    return isMatch;
};
userSchema.methods.createjwt = function () {
    return jwt.sign({ userId: this._id }, process.env.JWT_S, {
        expiresIn: '1d',
    });
};
export default mongoose.model('User', userSchema);
