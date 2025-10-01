import express from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
// Assuming this path is correct for your File model
import formatPhoneNumber from "../utils/phone.js";
import File from "../models/Files.js";
import { Mpesa } from "mpesa-api";

dotenv.config();

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Initialize GCS
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET);


// --- Route 1: Initial Page ---
router.get("/", (req, res) => {
    // Ensure you have an 'upload.ejs' or similar view
    res.render("upload");
});


// --- Route 2: File Upload and Payment Initiation ---
router.post("/upload", upload.single("file"), async (req, res) => {
    const { email, phone: rawPhone } = req.body;
    const file = req.file;
    const phone = formatPhoneNumber(rawPhone)

    if (!file) return res.status(400).send("No file uploaded");

    // Create a unique file name for GCS/DB
    const gcsFileName = `${Date.now()}_${path.basename(file.originalname)}`;

    try {
        // 1. Save to DB (Status: pending)
        await File.create({
            filename: gcsFileName,
            localPath: file.path,
            mimetype: file.mimetype,
            email: email,
            phone: phone,
            status: "pending"
        });

        // 2. Generate M-Pesa instance
        const mpesa = new Mpesa({
            clientKey: process.env.MPESA_KEY,
            clientSecret: process.env.MPESA_SECRET,
            securityCredential: process.env.MPESA_CREDENTIAL,
        }, 'sandbox'); // Use 'production' for live environment

        // 3. Fire STK Push
        mpesa.lipaNaMpesaOnline({
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            TransactionType: "CustomerPayBillOnline",
            Amount: 1, // Make sure this is a valid amount for sandbox/testing
            PartyA: phone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phone,
            // Pass the unique file name to the callback URL
            CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback?file=${encodeURIComponent(gcsFileName)}`,
            AccountReference: gcsFileName, // Use file name as unique ref
            TransactionDesc: "3D print payment",
            passKey: process.env.MPESA_PASSKEY,
        })
            .then((response) => {
                // STK push request successfully sent to Safaricom
                console.log("STK Push initiated successfully:", response);

                res.redirect(`/status/${gcsFileName}`);
            })
            .catch((err) => {
                // Improved error handling for M-Pesa API response
                console.error("M-Pesa STK Push Error:", err);
                const errorMessage = err.response?.data?.errorMessage || err.response?.data || err.message || "Unknown M-Pesa error";
                console.error("Upload error details:", errorMessage);

                // Clean up the local file and DB entry if the STK push itself failed
                fs.unlink(file.path, (e) => {
                    if (e) console.error(`Failed to delete local file after STK push failure: ${file.path}`, e);
                });
                File.deleteOne({ filename: gcsFileName }).catch(e => console.error("Failed to delete DB entry after STK push failure", e));

                res.status(500).send("Payment initiation failed. Please check the phone number and try again.");
            });

    } catch (err) {
        // Catch any errors during DB save or Mpesa object initialization
        console.error("Critical Upload/Setup Error:", err);
        // Clean up the local file if it was created before the crash
        if (file && fs.existsSync(file.path)) {
            fs.unlink(file.path, (e) => {
                if (e) console.error(`Failed to delete local file during critical error: ${file.path}`, e);
            });
        }
        res.status(500).send("An unexpected error occurred during processing.");
    }
});

// --- NEW API ENDPOINT: Check File Status ---
router.get("/status-check/:filename", async (req, res) => {
    try {
        const { filename } = req.params;
        const fileEntry = await File.findOne({ filename });

        if (!fileEntry) {
            return res.status(404).json({ status: "not_found" });
        }

        // Return only the current status
        res.json({
            status: fileEntry.status,
            filename: fileEntry.filename
        });

    } catch (error) {
        console.error("Error retrieving file status:", error);
        res.status(500).json({ status: "error" });
    }
});


// --- NEW VIEW ROUTE: Status Polling Page ---
router.get("/status/:filename", (req, res) => {
    // This renders the EJS view which contains the polling logic
    res.render("status_page", { filename: req.params.filename });
});



export default router;