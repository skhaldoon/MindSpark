const Chat = require("../models/Chat");
const multer = require("multer");
const User = require("../models/User");
const axios = require("axios"); // To call the AI model
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");



const convertSpeechToText = async (audioBuffer) => {
  try {
    console.log("Sending audio to Hugging Face Whisper API...");

    // Convert buffer to Base64
    const audioBase64 = audioBuffer.toString("base64");

    // Prepare payload
    const payload = { inputs: audioBase64 };

    // Send request to Hugging Face API
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/openai/whisper-small",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Whisper API Response:", response.data);
    return response.data.text || "Could not transcribe audio.";
  } catch (error) {
    console.error("Error in Whisper API request:", error.response?.data || error.message);
    return "Speech-to-text conversion failed.";
  }
};


const getSelectedModel = (req) => {
  const modelType = req.headers["selected-model"] || "default";
  if (modelType === "premium") {
    return "https://mindspark121-Fastapi-Pyschiatry-HybridApproch.hf.space";
  } else if (modelType === "economical") {
    return "https://mindspark121-fastapi-psychiatry-simplerag.hf.space";
  }
  return "https://mindspark121-fastapi-pyschiatry-deepseek.hf.space"; // Default model
};

const getAIResponse = async (chatHistory, req) => {
  try {
    const modelAPI = getSelectedModel(req);
    const response = await axios.post(`${modelAPI}/get_questions`, {
      message: chatHistory[chatHistory.length - 1], // Last user message
    });

    console.log("AI Response:", response.data);

    // ✅ Handle different response formats
    if (response.data) {
      if (response.data.questions && Array.isArray(response.data.questions)) {
        return response.data.questions.length > 0 ? response.data.questions[0] : "I couldn't find a relevant question.";
      }
      if (response.data.question) {
        return response.data.question; // Directly return the question for hybrid model
      }
    }

    console.warn("Unexpected API response format:", response.data);
    return "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error communicating with AI model:", error);
    return "Sorry, I couldn't process your request.";
  }
};


const detectDisorders = async (chatHistory, req) => {
  try {
    const modelAPI = getSelectedModel(req); // Get model based on user selection
    const response = await axios.post(`${modelAPI}/detect_disorders`, {
      chat_history: chatHistory,
    });
    console.log("🔍 Detect Disorders API Response:", response.data);


    // ✅ Validate Response Structure Before Returning
    if (!response.data || !Array.isArray(response.data.disorders)) {
      console.error("❌ Invalid disorders response format:", response.data);
      return [];
    }
    return response.data.disorders; // Ensure a list is returned
  } catch (error) {
    console.error("Error detecting disorders:", error);
    return [];
  }
};

const getTreatmentRecommendations = async (disorders, req) => {
  try {
    const modelAPI = getSelectedModel(req); // Get model based on user selection
    const response = await axios.post(`${modelAPI}/get_treatment`, {
      chat_history: disorders, // This should be a list of detected disorders
    });

    console.log("💊 Treatment Recommendations API Response:", response.data);
    // ✅ Validate Response Structure Before Returning
    if (!response.data || typeof response.data.treatments !== "object") {
      console.error("❌ Invalid treatment response format:", response.data);
      return {};
    }

    return response.data.treatments;
  } catch (error) {
    console.error("Error getting treatment recommendations:", error);
    return {};
  }
};

const summarizeChat = async (chatHistory, req) => {
  try {
    const modelAPI = getSelectedModel(req); // Get model based on user selection
    const response = await axios.post(`${modelAPI}/summarize_chat`, {
      chat_history: chatHistory,
    });

    console.log("📜 Chat Summary API Response:", response.data);
    // ✅ Validate Response Structure Before Returning
    if (!response.data || typeof response.data.summary !== "string") {
      console.error("❌ Invalid summary response format:", response.data);
      return "Could not generate summary.";
    }
    return response.data.summary;
  } catch (error) {
    console.error("Error summarizing chat:", error);
    return "Could not generate summary.";
  }
};


// Fetch all chats for logged-in user
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 }).select("patientName patientAge _id messages");
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Fetch messages of a specific chat
const getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Create a new chat
const createChat = async (req, res) => {
  try {
    const { patientName, patientAge } = req.body;
    // Ensure valid input
    if (!patientName || !patientAge) {
      return res.status(400).json({ message: "Patient name and age are required." });
    }
    const newChat = new Chat({ user: req.user.id, patientName, patientAge, messages: [] });
    await newChat.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { chats: newChat._id } });
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Save new message in chat
const addMessage = async (req, res) => {
  try {
    const { chatId, text, sender, username, age } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Store user's message
    chat.messages.push({ sender, text });
    await chat.save();

    let aiResponse;

    if (text.toLowerCase() === "quit" || text.toLowerCase() === "end") {
      // Fetch summary, disorders, and treatments
      const chatHistory = chat.messages.map(msg => msg.text);
      const disorders = await detectDisorders(chatHistory, req);
      const treatments = await getTreatmentRecommendations(disorders, req);
      const summary = await summarizeChat(chatHistory, req);

      // Ensure the folder exists
      const pdfDirectory = path.join(__dirname, "../generated_reports/");
      if (!fs.existsSync(pdfDirectory)) {
        fs.mkdirSync(pdfDirectory, { recursive: true });
      }

      // Generate PDF file path
      const pdfPath = path.join(pdfDirectory, `${chatId}.pdf`);
      await generateChatPDF(pdfPath, chat.patientName , chat.patientAge , summary, disorders, treatments);

      // Generate the download link
      const pdfDownloadLink = `http://localhost:5000/api/chat/download-pdf/${chatId}`;

      // Send response with PDF link
      aiResponse = `[Download PDF Report](${pdfDownloadLink})`;

    } else {
      aiResponse = await getAIResponse(chat.messages.map(msg => msg.text), req);
    }

    // Store AI response
    chat.messages.push({ sender: "ai", text: aiResponse });
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// Function to generate PDF
const generateChatPDF = async (filePath, username, age, summary, disorders, treatments) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // HEADER WITH BLUE BACKGROUND
    const headerHeight = 90;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#2C5B9C");

    // Left-side Logo
    const logoPath = path.join(__dirname, "../uploads/Uet.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 20, 20, { width: 60 });
    }

    // Centered Text
    doc.fillColor("white")
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("MINDSPARK", 0, 30, { align: "center" })
      .fontSize(18)
      .text("Patient's Medical Report", { align: "center" });

    // Right-side Logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width - 80, 20, { width: 60 });
    }

    doc.moveDown(2);

    // PATIENT DEMOGRAPHICS - PROPERLY ALIGNED
    doc.fillColor("#2C5B9C").fontSize(16).text("Patient Demographics", 60, doc.y, { underline: true }).moveDown(0.5);
    doc.fillColor("black").fontSize(14);

    // Left aligned with spacing
    doc.text("Name: " + (username || "N/A"), 70, doc.y);
    doc.text("Age: " + (age || "N/A") , 70, doc.y);
    doc.moveDown(2);

    // CLINICAL SUMMARY (REMOVING UNWANTED TEXT)
    doc.fillColor("#2C5B9C").fontSize(16).text("Clinical Summary", 60, doc.y, { underline: true }).moveDown(0.5);
    doc.fillColor("black").fontSize(12).text(summary.replace(/Download PDF Report.*$/, ""), { width: 500, align: "left" }).moveDown(2);

    // DETECTED DISORDERS WITH BOXED HEADERS
    const disorderList = Array.isArray(disorders) ? disorders : [];
    doc.fillColor("#2C5B9C").fontSize(16).text("Detected Disorders", 60, doc.y, { underline: true }).moveDown(0.5);
    doc.fillColor("black").fontSize(14);
    if (disorderList.length === 0) {
      doc.fontSize(12).text("No disorders detected.", 70, doc.y).moveDown(0.5);
    } else {
      disorderList.forEach((disorder, index) => {
        doc.text(`${index + 1}. ${disorder}`, 75, doc.y).moveDown(0.5);
      });
    }
    doc.moveDown(1.5);

    // RECOMMENDED TREATMENTS - FORMATTED WITH COLOR BLOCKS
    doc.fillColor("#2C5B9C").fontSize(16).text("Recommended Treatments", 60, doc.y, { underline: true }).moveDown(0.5);
    doc.fillColor("black").fontSize(14);

    if (Object.keys(treatments).length > 0) {
      Object.entries(treatments).forEach(([disorder, treatment]) => {
        doc.rect(60, doc.y, 500, 25).fill("#DFF0D8"); // Green background for treatment name
        doc.fillColor("#2C5B9C").font("Helvetica-Bold").text(disorder, 65, doc.y + 5);
        doc.moveDown(1);
        doc.fillColor("black").font("Helvetica").text(treatment || "No specific treatment found.", 80, doc.y, { width: 450, align: "left" });
        doc.moveDown(1.5);
      });
    } else {
      doc.fontSize(12).text("No specific treatments available.", 70, doc.y, { width: 500, align: "left" }).moveDown(0.5);
    }
    doc.moveDown(1);

    // ADDING GRAPHS - ENSURING PROPER VISIBILITY
    const barChartPath = path.join(__dirname, "../uploads/disorder_bar_chart.png");
    const pieChartPath = path.join(__dirname, "../uploads/treatment_pie_chart.png");

    if (fs.existsSync(barChartPath) || fs.existsSync(pieChartPath)) {
      doc.addPage();
      doc.fillColor("#2C5B9C").fontSize(18).text("Visual Analytics", { underline: true, align: "center" }).moveDown(1);

      // Add Bar Chart with Title
      if (fs.existsSync(barChartPath)) {
        doc.fillColor("black").fontSize(14).text("Detected Disorders", { align: "center" }).moveDown(0.5);
        doc.image(barChartPath, { width: 450, align: "center" }).moveDown(2);
      }

      // Add Pie Chart with Title
      if (fs.existsSync(pieChartPath)) {
        doc.fillColor("black").fontSize(14).text("Treatment Distribution", { align: "center" }).moveDown(0.5);
        doc.image(pieChartPath, { width: 400, align: "center" }).moveDown(2);
      }
    }

    // FOOTER
    // Move to the bottom of the last page before adding the footer
    doc.moveDown(5); // Move cursor down to create space

    // Draw Footer Background
    const footerHeight = 50;
    doc.rect(0, doc.page.height - footerHeight, doc.page.width, footerHeight).fill("#2C5B9C");

    // Set text inside footer
    doc.fillColor("white").fontSize(10)
      .text("MindSpark - AI Psychiatric Assistant", 60, doc.page.height - 40, { align: "left" });

    doc.fillColor("white").fontSize(10)
      .text("Contact: support@mindspark.ai", 60, doc.page.height - 25, { align: "left" });

    // Ensure footer stays on the last page
    doc.y = doc.page.height - 10;



    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};


const renameChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { newChatName } = req.body;

    if (!newChatName) {
      return res.status(400).json({ message: "New chat name is required." });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.patientName = newChatName; // Rename chat using patient name field
    chat.patientAge = chat.patientAge;
    await chat.save();

    res.json({ message: "Chat renamed successfully", chat });
  } catch (error) {
    console.error("Error renaming chat:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    await Chat.findByIdAndDelete(chatId);

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const shareChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId).select("messages patientName patientAge");
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Generate a sharable chat link
    const shareableLink = `http://localhost:3000/share/${chatId}`;

    res.json({ message: "Chat is now sharable", shareableLink });
  } catch (error) {
    console.error("Error sharing chat:", error);
    res.status(500).json({ message: "Server error", error });
  }
};





// Export functions properly
module.exports = {
  getUserChats,
  getChatMessages,
  createChat,
  addMessage,
  convertSpeechToText,
  renameChat,
  deleteChat,
  shareChat
};
