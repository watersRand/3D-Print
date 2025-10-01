import express from "express";
import { Storage } from "@google-cloud/storage";
import File from "../models/Files.js";

const router = express.Router();
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET);

// --- Route 1: List Files (Data from MongoDB) ---
router.get("/files", async (req, res) => {
    try {
        // Fetch ALL file records from the MongoDB database. 
        // The DB is the single source of truth for payment status, Mpesa reference, and deadline.
        const dbFiles = await File.find({}).lean();

        // Map the Mongoose documents into the structure expected by the admin.ejs template.
        // We ensure paid (boolean) is converted to the string "true"/"false" that EJS expects.
        const fileData = dbFiles.map((f) => {
            // Convert Date object to ISO string, and boolean to string for EJS check compatibility
            const collectionDeadlineISO = f.collectionDeadline ? f.collectionDeadline.toISOString() : null;

            return {
                // Use filename for EJS display and download key
                name: f.filename,
                // All order-specific details are nested under 'metadata' to match the EJS structure
                metadata: {
                    email: f.email || "-",
                    paid: f.paid ? "true" : "false", // EJS checks for string "true"
                    status: f.status || "pending",
                    mpesaReference: f.mpesaReceipt || "-",
                    // Use ISO string for deadline (EJS will convert it back to a Date object)
                    collectionDeadline: collectionDeadlineISO,
                },
                // Include the full file object ID for internal reference
                dbId: f._id
            }
        });

        res.render("admin", { files: fileData });

    } catch (error) {
        // If MongoDB connection fails, this will catch the error
        console.error("CRITICAL: Error fetching files from MongoDB for Admin Dashboard:", error);
        res.status(500).send("Database error: Could not retrieve order data.");
    }
});

// --- Route 2: Download File (Still uses GCS) ---
router.get("/download/:name", async (req, res) => {
    try {
        const file = bucket.file(req.params.name);
        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 15 * 60 * 1000,
        });
        res.redirect(url);
    } catch (error) {
        console.error(`Error generating signed URL for ${req.params.name}:`, error);
        res.status(500).send("Could not generate download link.");
    }
});

export default router;