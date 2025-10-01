import express from "express";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import File from "../models/Files.js";
import nodemailer from "nodemailer";

const router = express.Router();
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET);

// Gmail transporter (App Password required)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// --- Route 3: M-Pesa Callback Handler (Essential for GCS Upload) ---
router.post("/callback", async (req, res) => {
    // 1. Acknowledge receipt of the callback immediately as required by Safaricom
    res.json({ "ResultCode": 0, "ResultDesc": "Accepted" });

    const mpesaCallbackData = req.body;
    const gcsFileName = req.query.file;

    console.log("M-Pesa Callback Received:", mpesaCallbackData);

    // M-Pesa sends the actual data inside Body.stkCallback
    const callbackBody = mpesaCallbackData.Body?.stkCallback;

    if (!callbackBody) {
        console.error("Invalid M-Pesa callback structure received.");
        return;
    }

    try {
        const resultCode = callbackBody.ResultCode;
        const checkoutRequestID = callbackBody.CheckoutRequestID;

        // Find the file entry in the database using the unique identifier
        const fileEntry = await File.findOne({ filename: gcsFileName });

        if (!fileEntry) {
            console.error(`File entry not found for filename: ${gcsFileName}`);
            return;
        }

        if (resultCode === 0) {
            // **Payment Successful** 🚀
            const localFilePath = fileEntry.localPath;
            const destination = fileEntry.filename;

            // 1. Upload file to GCS
            await bucket.upload(localFilePath, {
                destination: destination,
                metadata: {
                    contentType: fileEntry.mimetype,
                },
            });
            console.log(`Successfully uploaded ${destination} to GCS.`);


            // Extract MpesaReceiptNumber (Check the structure of your M-Pesa response)
            let mpesaReference = null;
            const metadata = callbackBody.CallbackMetadata?.Item;
            if (metadata) {
                const receiptItem = metadata.find(item => item.Name === 'MpesaReceiptNumber');
                mpesaReference = receiptItem ? receiptItem.Value : null;
            }

            // 2. Set 2-week collection deadline
            const collectionDateline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            // 3. Update DB status and GCS URL
            const dbResult = await File.updateOne({ filename: gcsFileName }, {
                $set: {
                    paid: true,
                    status: "uploaded",
                    gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${destination}`,
                    mpesaReceipt: mpesaReference,
                    checkoutRequestID: checkoutRequestID,
                    collectionDeadline: collectionDateline
                }
            });

            console.log("Database Update Result (Success):", dbResult);


            // 4.Send email
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: fileEntry.email,
                subject: "Your 3D Print Order is Confirmed ✅",
                text: `
Hi ${fileEntry.email},

Your payment was received successfully 🎉
File: ${fileEntry.filename}
Receipt: ${mpesaReference || "N/A"}

Your 3D print will be ready for collection by:
📅 ${collectionDateline.toDateString()}

Location: JKUAT Robotics Lab
Price Paid: KES 100

Thank you for using our 3D printing service at JKUAT!

- Robotics Committee
                `
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`📧 Email sent to ${fileEntry.email}`);
            } catch (emailErr) {
                console.error("❌ Failed to send email:", emailErr);
            }

            // 4. Clean up local file
            fs.unlink(localFilePath, (err) => {
                if (err) console.error(`Failed to delete local file ${localFilePath}:`, err);
                else console.log(`Successfully deleted local file: ${localFilePath}`);
            });

        } else {
            // **Payment Failed/Cancelled** 😔
            console.warn(`Payment failed for ${gcsFileName}. ResultCode: ${resultCode}. Desc: ${callbackBody.ResultDesc}`);
            // Update DB status to failed
            const dbResult = await File.updateOne({ filename: gcsFileName }, {
                $set: {
                    paid: false,
                    status: "payment_failed",
                    failureReason: callbackBody.ResultDesc,
                    checkoutRequestID: checkoutRequestID,
                }
            });
            console.log("Database Update Result (Failure):", dbResult);

            // Clean up local file immediately since payment failed
            fs.unlink(fileEntry.localPath, (err) => {
                if (err) console.error(`Failed to delete failed-payment local file ${fileEntry.localPath}:`, err);
                else console.log(`Successfully deleted local file after payment failure: ${fileEntry.localPath}`);
            });
        }
    } catch (error) {
        console.error("Error processing M-Pesa callback or GCS upload:", error);
    }
});

export default router;
