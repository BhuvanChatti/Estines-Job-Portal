import mongoose from 'mongoose';
import colors from 'colors';
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        //console.log(`Connected to MongoDB Database ${mongoose.connection.host}`.bgMagenta.white);
    }
    catch (error) {
        //console.log(`Mongo ERROR ${error}`.bgRed.white);
    }
};
export default connectDB;