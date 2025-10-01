import express from "express";;
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import uploadRoutes from "./routes/upload.js";
import mpesaRoutes from "./routes/mpesa.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err.message));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "views"));

// Routes
app.use("/", uploadRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
