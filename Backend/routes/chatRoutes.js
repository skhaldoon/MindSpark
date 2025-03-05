const express = require("express");
const chatController = require("../controllers/chatController");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { getUserChats, getChatMessages, createChat, addMessage, convertSpeechToText, shareChat, deleteChat, renameChat } = chatController;
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.get("/", protect, getUserChats);
router.get("/:chatId", protect, getChatMessages);
router.post("/", protect, createChat);
router.post("/message", protect, addMessage);

router.post("/speech-to-text", upload.single("audio"), async (req, res) => {
    console.log("Received speech-to-text request...");

    if (!req.file) {
        console.error("No audio file received.");
        return res.status(400).json({ message: "No audio file uploaded" });
    }

    try {
        console.log("Processing file:", req.file);

        const transcription = await convertSpeechToText(req.file.buffer);
        console.log("Transcription:", transcription);

        res.json({ transcription });
    } catch (error) {
        console.error("Speech-to-text conversion error:", error);
        res.status(500).json({ message: "Speech-to-text conversion failed", error });
    }
});


router.get("/download-pdf/:chatId", (req, res) => {
    const chatId = req.params.chatId;
    const pdfPath = path.join(__dirname, `../generated_reports/${chatId}.pdf`);

    if (fs.existsSync(pdfPath)) {
        res.download(pdfPath, `${chatId}-ChatSummary.pdf`);
    } else {
        res.status(404).json({ message: "PDF not found" });
    }
});

router.put("/rename/:chatId", renameChat);
router.delete("/delete/:chatId", deleteChat);
router.get("/share/:chatId", shareChat);



module.exports = router;
