import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    filename: String,
    localPath: String,
    mimetype: String,
    email: String,
    phone: String,
    paid: { type: Boolean, default: false },
    mpesaReceipt: String,
    paymentTime: Date,
    collectionDeadline: Date,
    status: { type: String, default: "pending" } // pending | paid | failed
}, { timestamps: true });

const File = mongoose.model("File", fileSchema);
export default File;

