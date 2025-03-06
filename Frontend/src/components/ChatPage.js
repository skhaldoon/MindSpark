import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaPaperPlane, FaSearch, FaLanguage, FaCog, FaUser, FaEllipsisV, FaStop, FaMicrophone, FaBars, FaTimes } from "react-icons/fa";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import PhotoCameraFrontOutlinedIcon from '@mui/icons-material/PhotoCameraFrontOutlined';
import icon from '../assets/icon.png';
import WidthNormalRoundedIcon from '@mui/icons-material/WidthNormalRounded';
import Divider from '@mui/material/Divider';
import API_BASE_URL from "./Config";

// Ammad 

const ChatPage = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [selectedChat, setSelectedChat] = useState(null);
    const [chats, setChats] = useState([]);
    const [open, setOpen] = useState(true);
    // State to track recording status
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]); // Fix: Using ref to store audio chunks

    const [selectedModel, setSelectedModel] = useState(() => {
        const storedModel = localStorage.getItem("selectedModel");
        const isModelSelected = localStorage.getItem("modelSelectedByUser");
        return isModelSelected ? storedModel || "default" : "default";
    });
    const [tempSelectedModel, setTempSelectedModel] = useState(selectedModel);
    const [showUpgradePopup, setShowUpgradePopup] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [patientName, setPatientName] = useState("");
    const [patientAge, setPatientAge] = useState("");
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameChatId, setRenameChatId] = useState(null);
    const [newChatName, setNewChatName] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth); // Update window width state
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (windowWidth < 900 && open) {
            setOpen(false);
        }
    }, [windowWidth]); // Runs every time `windowWidth` changes

    
    

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".user-menu")) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem("token"); // ✅ Remove token
        localStorage.removeItem("user"); // ✅ Remove user data
        window.location.href = "/"; // ✅ Redirect to landing page
    };

    const openRenameModal = (chat) => {
        setRenameChatId(chat._id);
        setNewChatName(chat.patientName);
        setShowRenameModal(true);
    };

    const handleRenameChat = async () => {
        if (!newChatName.trim()) {
            alert("Please enter a valid chat name.");
            return;
        }

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/rename/${renameChatId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newChatName }),
            });

            const data = await response.json();
            if (data.chat) {
                setChats(chats.map(chat => chat._id === renameChatId ? { ...chat, patientName: newChatName } : chat));
            }
            setShowRenameModal(false);
        } catch (error) {
            console.error("Error renaming chat:", error);
        }
    };

    const shareChat = async (chatId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/share/${chatId}`);
            const data = await response.json();

            if (data.shareableLink) {
                navigator.clipboard.writeText(data.shareableLink);
                alert("Chat link copied to clipboard!");
            }
        } catch (error) {
            console.error("Error sharing chat:", error);
        }
    };

    const deleteChat = async (chatId) => {
        const token = localStorage.getItem("token");

        try {
            await fetch(`${API_BASE_URL}/api/chat/delete/${chatId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Remove the deleted chat from the list
            const updatedChats = chats.filter(chat => chat._id !== chatId);
            setChats(updatedChats);

            // ✅ If the deleted chat was active, select the next available chat
            if (selectedChat === chatId) {
                if (updatedChats.length > 0) {
                    setSelectedChat(updatedChats[0]._id); // ✅ Open next chat
                    fetchMessages(updatedChats[0]._id);
                } else {
                    startNewChat(); // ✅ If no chats left, create a new chat
                }
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    // Function to handle temporary selection in the popup
    const handleTempSelection = (modelType) => {
        setTempSelectedModel(modelType);
    };
    // Function to confirm the model selection
    const confirmModelSelection = () => {
        setSelectedModel(tempSelectedModel);
        localStorage.setItem("selectedModel", String(tempSelectedModel));
        localStorage.setItem("modelSelectedByUser", "true"); // ✅ Mark that the user has selected a model
        setShowUpgradePopup(false);
    };

    const cancelModelSelection = () => {
        setTempSelectedModel(selectedModel);
        setShowUpgradePopup(false);
    };


    useEffect(() => {
        if (isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    }, [isRecording]);

    const startRecording = async () => {
        try {
            console.log("Recording started...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            audioChunksRef.current = []; // Reset audioChunks

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data); // Store data in ref
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("Recording stopped.");
                if (audioChunksRef.current.length === 0) {
                    console.error("No audio data available.");
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                console.log("Sending audio to backend...", audioBlob);
                await sendAudioToBackend(audioBlob);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToBackend = async (audioBlob) => {
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.wav");

        try {
            console.log("Sending audio blob:", audioBlob);
            const response = await fetch(`${API_BASE_URL}/api/chat/speech-to-text`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("Transcription Response:", data);

            if (data.transcription) {
                setInputMessage(data.transcription);
            } else {
                console.error("No transcription received.");
            }
        } catch (error) {
            console.error("Error converting speech to text:", error);
        }
    };

    const toggleSidebar = () => {
        setOpen((prevOpen) => !prevOpen); // ✅ Always toggle sidebar state
    };
    
    

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".menu-container")) {
                setMenuOpen(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setChats(data);
        // Automatically select the most recent chat
        if (data.length > 0) {
            setSelectedChat(data[0]._id);
            fetchMessages(data[0]._id);
        } else {
            startNewChat(); // If no chats exist, create a new one
        }
    };

    const fetchMessages = async (chatId) => {
        setSelectedChat(chatId); // Set selected chat
        const token = localStorage.getItem("token");
        const selectedModel = localStorage.getItem("selectedModel") || "default";


        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "selected-model": selectedModel,
                },
            });

            const data = await response.json();
            setMessages(data); // Load chat messages
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.classList.toggle("dark");
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !selectedChat) return;

        const token = localStorage.getItem("token");
        const selectedModel = localStorage.getItem("selectedModel") || "default";

        const user = JSON.parse(localStorage.getItem("user")) || {};
        // Step 1: Show the user's message immediately
        const newUserMessage = {
            sender: "user",
            text: inputMessage,
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);

        setInputMessage(""); // Clear input field


        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "selected-model": selectedModel },
                body: JSON.stringify({
                    chatId: selectedChat, text: inputMessage, sender: "user", username: user.fullName || "Unknown", // Ensure username is sent
                    age: user.age || "N/A"
                }),
            });
            const updatedChat = await response.json();
            const aiResponse = updatedChat.messages[updatedChat.messages.length - 1].text; // Get last AI message
            if (!aiResponse || aiResponse.trim() === "") {
                aiResponse = "Generating response, please wait...";
            }
            let aiMessage = { sender: "ai", text: "" };
            setMessages((prevMessages) => [...prevMessages, aiMessage]);
            // Step 4: Simulate AI typing effect
            for (let i = 0; i < aiResponse.length; i++) {
                await new Promise((resolve) => setTimeout(resolve, 20)); // Simulate typing delay
                setMessages((prevMessages) =>
                    prevMessages.map((msg, index) =>
                        index === prevMessages.length - 1
                            ? { ...msg, text: msg.text + aiResponse[i] } // Append one letter at a time
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const toggleMenu = (index) => {
        setMenuOpen(menuOpen === index ? null : index);
    };

    const startNewChat = () => {

        setShowPatientModal(true); // Show patient details popup
    };

    const handlePatientSubmit = async () => {
        if (!patientName.trim() || !patientAge.trim()) {
            alert("Please enter patient name and age.");
            return;
        }

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ patientName, patientAge })
            });

            const newChat = await response.json();
            setChats([newChat, ...chats]); // Add new chat to the list
            setSelectedChat(newChat._id); // Set as active chat
            setMessages([]); // Clear previous messages
            setShowPatientModal(false); // Close the popup
            setPatientName("");
            setPatientAge("");
        } catch (error) {
            console.error("Error creating new chat:", error);
        }
    };

    const [rightSidebarOpen, setRightSidebarOpen] = useState(true); // Initially open on large screens

    const toggleRightSidebar = () => {
        setRightSidebarOpen((prev) => !prev);
    };







    return (
        <div className={`flex h-screen overflow-hidden  ${darkMode ? "bg-gray-900 text-white" : "bg-[#d9e4eb]"}`}>
            <nav className={`fixed top-0 w-full p-2 shadow-md z-50 flex justify-between items-center ${darkMode ? "bg-gray-900 text-white" : "bg-white-500 text-white"}`}>
                <div className="flex items-center">
                
                    <img src={icon} className="w-10 h-10 md:w-14 md:h-14 cursor-pointer" alt="Icon" />
                    <h2 className={`text-sm md:text-2xl font-bold mt-1 md:mt-2 cursor-pointer ${darkMode ? "text-white" : "text-black"}`}>MINDSPARK</h2>
                    <div 
                        onClick={toggleSidebar} 
                        className={`w-6 h-6 md:w-8 md:h-8 border-2 mt-1 md:mt-3 ml-1 border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400`}
                    >
                        <WidthNormalRoundedIcon sx={{fontSize: "18px"}} className={`w-2 h-2 md:w-6 md:h-6 ${darkMode ? "text-white" : "text-black"}`} />
                    </div>



                </div>

                <div className="flex justify-end space-x-4 mb-2 mr-8">
                    <div className={`w-6 h-6 md:w-10 md:h-10 border-2 mt-3 ml-3 border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-500`}>
                        <button className={`relative ${darkMode ? "text-white" : "text-slate-700"}`}>
                            <FaSearch size={16} className="md:size-5" />
                        </button>
                    </div>

                    <div className={`w-6 h-6 md:w-10 md:h-10 border-2 mt-3 ml-3 border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-500`}>
                        <button className={`relative ${darkMode ? "text-white" : "text-slate-700"}`}>
                            <FaLanguage size={16} className="md:size-5" />
                        </button>
                    </div>

                    <div className={`w-6 h-6 md:w-10 md:h-10 border-2 mt-3 ml-3 border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-500`}>
                        <button className={`relative ${darkMode ? "text-white" : "text-slate-700"}`} onClick={toggleDarkMode}>
                            <FaCog size={16} className="md:size-5" />
                        </button>
                    </div>

                    <div className={` w-6 h-6 md:w-10 md:h-10 border-2 mt-3 ml-3 border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-500`} onClick={toggleUserMenu}>
                        <button className={`relative ${darkMode ? "text-white" : "text-slate-700"}`}>
                            <FaUser size={16} className="md:size-5" />
                        </button>
                    </div>
                    {userMenuOpen && (
                        <div className="user-menu absolute right-0 mt-12 w-50 md:w-56 bg-white shadow-lg rounded-lg p-4 transition-opacity duration-200 opacity-100 z-100 overflow-visible">
                            {/* Show User Info */}
                            {localStorage.getItem("user") ? (
                                (() => {
                                    const user = JSON.parse(localStorage.getItem("user"));
                                    return (
                                        <div className="text-center">
                                            <p className="font-semibold text-black">{user.fullName}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p className="text-center text-gray-600">Loading...</p>
                            )}

                            {/* Logout Button */}
                            <button
                                className="mt-3 w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-150"
                                onClick={logout} // ✅ Call logout function
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>
            <div className={`flex flex-1 pt-20`}>
                {/* Sidebar */}
                {/* Sidebar Backdrop (Closes on Click Outside - Mobile Only) */}
                {open && window.innerWidth < 1200 && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={toggleSidebar}
                    ></div>
                )}

                {/* Sidebar (Overlay on Small Screens) */}
                <aside
                    className={`fixed  left-0 h-full w-64 p-4 shadow-lg flex flex-col transition-transform duration-300 z-50
                        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}
                        ${open ? "translate-x-0" : "-translate-x-full"}
                        md:w-1/5 md:static md:shadow-md md:translate-x-0`}
                >
                    <nav className="flex flex-col space-y-4 pl-2 mt-4">
                        <Link to="/" className="p-3 hover:bg-[#d9e4eb] border-solid rounded-md text-gray-600 font-medium flex hover:text-black">
                            <HomeOutlinedIcon className="mr-2" /> Home
                        </Link>
                        <Link to="/about" className="p-3 hover:bg-[#d9e4eb] border-solid rounded-md text-gray-600 font-medium hover:text-black">
                            <PeopleAltOutlinedIcon className="mr-2" /> Community Feed
                        </Link>
                        <div
                            className="p-3 hover:bg-[#d9e4eb] border-solid rounded-md text-gray-600 font-medium hover:text-black cursor-pointer"
                            onClick={() => setShowUpgradePopup(true)}
                        >
                            <BusinessCenterOutlinedIcon className="mr-2" /> Manage Subscription
                        </div>

                        <Divider className="" />
                        <Link to="/chat" className="p-3 border-solid rounded-md bg-[#d9e4eb] text-black font-medium">
                            <ChatOutlinedIcon className="mr-2" /> AI Chat Bot
                        </Link>
                        <Link to="/image" className="p-3 hover:bg-[#d9e4eb] border-solid rounded-md text-gray-600 font-medium hover:text-black">
                            <PhotoCameraFrontOutlinedIcon className="mr-2" /> Image Generator
                        </Link>
                    </nav>
                    <div
                        className={`mt-20 md:mt-auto p-3 rounded-md ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"} flex flex-col items-center`}
                    >
                        {localStorage.getItem("user") ? (
                            (() => {
                                const user = JSON.parse(localStorage.getItem("user"));
                                return (
                                    <>
                                        <p className="font-semibold text-center">{user.fullName}</p>
                                        <p className="text-sm text-gray-500 text-center">{user.email}</p>
                                    </>
                                );
                            })()
                        ) : (
                            <p className="text-center text-sm">Loading user...</p>
                        )}
                        <button className="mt-2 w-full bg-black text-white py-2 rounded-full text-sm" onClick={() => setShowUpgradePopup(true)}>
                            Upgrade to Pro
                        </button>
                    </div>

                </aside>


                {showRenameModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] flex flex-col">
                            <h2 className="text-2xl font-semibold text-center mb-6">Rename Chat</h2>

                            <input
                                type="text"
                                className="w-full p-3 border rounded-md mb-4"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                            />

                            <div className="flex justify-between">
                                <button className="w-1/2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium mr-2"
                                    onClick={() => setShowRenameModal(false)}>Cancel</button>
                                <button className="w-1/2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium"
                                    onClick={handleRenameChat}>Rename</button>
                            </div>
                        </div>
                    </div>
                )}



                {/* Patient Details Popup */}
                {showPatientModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] flex flex-col">
                            <h2 className="text-2xl font-semibold text-center mb-6">Enter Patient Details</h2>

                            <input
                                type="text"
                                placeholder="Patient Name"
                                className="w-full p-3 border rounded-md mb-4"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />

                            <input
                                type="number"
                                placeholder="Patient Age"
                                className="w-full p-3 border rounded-md mb-4"
                                value={patientAge}
                                onChange={(e) => setPatientAge(e.target.value)}
                            />

                            <div className="flex justify-between">
                                <button
                                    className="w-1/2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium mr-2"
                                    onClick={() => setShowPatientModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="w-1/2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium"
                                    onClick={handlePatientSubmit}
                                >
                                    Start Chat
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Chat Section */}
                <main className="flex-1 flex flex-col p-6">
                    {/* Chat Messages */}
                    <div className={`flex-1 overflow-auto mt-4 p-4 rounded-md shadow-md ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.sender !== "user" && <div className="w-8 h-8 bg-black rounded-full mr-2"></div>}
                                <div className={`p-3 rounded-lg max-w-lg ${msg.sender === "user" ? "bg-gray-200 text-white" : "bg-gray-200 text-gray-800"}`}>
                                    <p className="text-gray-800 font-medium">{msg.sender === "user" ? "You" : "AI"}</p>
                                    <p className="text-gray-600 text-sm">
                                        {msg.text.split("\n").map((line, index) => (
                                            <React.Fragment key={index}>
                                                {line.includes("[Download PDF Report]") ? (
                                                    (() => {
                                                        const match = line.match(/\((.*?)\)/);
                                                        return match && match[1] ? (
                                                            <a
                                                                href={match[1]} // Extract link safely
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 underline"
                                                            >
                                                                Download Report
                                                            </a>
                                                        ) : (
                                                            "Generating PDF, please wait..."
                                                        );
                                                    })()
                                                ) : (
                                                    line
                                                )}

                                                <br />
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </div>

                            </div>

                        ))}

                    </div>

                    {/* Message Input */}
                    < div className={`mt-4 flex items-center p-3 rounded-md shadow-md ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className={`flex-1 p-2 border-none outline-none ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault(); // Prevents newline in input field
                                    sendMessage();
                                }
                            }}
                        />
                        {/* Voice-to-Text Button */}
                        <button onClick={() => setIsRecording((prev) => !prev)}>
                            {isRecording ? <FaStop /> : <FaMicrophone />}
                        </button>
                        <button className="ml-4 text-blue-500" onClick={sendMessage}>
                            <FaPaperPlane size={20} />
                        </button>
                    </div>
                </main>
                {/* Floating Button to Open Right Sidebar (Visible on Small Screens) */}
                {!rightSidebarOpen && (
                    <button 
                        onClick={toggleRightSidebar} 
                        className="fixed top-3 mt-2 right-2 text-slate-700 hover:bg-slate-500 w-6 h-6 flex items-center justify-center rounded-full shadow-lg md:hidden z-50"
                    >
                        <FaBars size={12} />
                    </button>
                )}



                {/* Right Sidebar Backdrop (Closes on Click Outside - Mobile Only) */}
                {rightSidebarOpen && window.innerWidth < 900 && (
                    <div 
                        className="fixed  inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
                        onClick={toggleRightSidebar}
                    ></div>
                )}

                {/* Chat History Sidebar */}
                <aside
                    className={`fixed right-0 h-full w-64 p-4 shadow-lg flex flex-col transition-transform duration-300 z-50 md:z-0
                        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}
                        ${rightSidebarOpen ? "translate-x-0" : "translate-x-full"}
                        md:w-1/4 md:static md:shadow-md md:translate-x-0`}
                >
                    {/* Close Button (Only on Small Screens) */}
                    <button 
                        onClick={toggleRightSidebar} 
                        className="absolute top-4 right-4 text-gray-500 hover:text-black md:hidden"
                    >
                        <FaTimes size={20} />
                    </button>

                    <h3 onClick={startNewChat} className="font-semibold text-lg mt-6 mb-4 border p-2 rounded cursor-pointer">
                        New Chat
                    </h3>

                    <div className="space-y-2">
                        {chats.map((chat, index) => (
                            <div key={index} onClick={() => fetchMessages(chat._id)} className="flex justify-between items-center hover:text-black cursor-pointer border p-2 rounded relative">
                                {chat.patientName ? `${chat.patientName} (Age: ${chat.patientAge})` : `Chat ${chat._id.substring(0, 6)}`}
                                <button onClick={() => toggleMenu(index)} className="relative menu-container">
                                    <FaEllipsisV size={16} />
                                </button>
                                {menuOpen === index && (
                                    <div className="absolute right-0 top-8 w-32 bg-white text-black shadow-md rounded-md z-50 menu-container">
                                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-300" onClick={() => shareChat(chat._id)}>Share</button>
                                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-300" onClick={() => openRenameModal(chat)}>Rename</button>
                                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-300" onClick={() => deleteChat(chat._id)}>Delete</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>



                {/* Upgrade to Pro Popup */}
                {showUpgradePopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] flex flex-col">
                            <h2 className="text-2xl font-semibold text-center mb-6">Upgrade Your AI Model</h2>

                            <div className="space-y-4">
                                {/* Premium Model Option */}
                                <button
                                    className={`flex items-center justify-between w-full p-4 rounded-lg border transition-all ${tempSelectedModel === "premium"
                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                        : "border-gray-300 hover:bg-gray-100"
                                        }`}
                                    onClick={() => handleTempSelection("premium")}
                                >
                                    <div>
                                        <p className="font-medium text-lg">💎 Premium Model</p>
                                        <p className="text-sm text-gray-500">Best performance & highest accuracy</p>
                                    </div>
                                    <span className="text-blue-600 font-semibold">$200</span>
                                </button>

                                {/* Economical Model Option */}
                                <button
                                    className={`flex items-center justify-between w-full p-4 rounded-lg border transition-all ${tempSelectedModel === "economical"
                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                        : "border-gray-300 hover:bg-gray-100"
                                        }`}
                                    onClick={() => handleTempSelection("economical")}
                                >
                                    <div>
                                        <p className="font-medium text-lg">⚡ Economical Model</p>
                                        <p className="text-sm text-gray-500">Affordable & optimized for cost efficiency</p>
                                    </div>
                                    <span className="text-blue-600 font-semibold">$30</span>
                                </button>
                            </div>
                            {/* Confirmation and Cancel Buttons */}
                            <div className="mt-4 flex justify-between">
                                <button
                                    className="w-1/2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium mr-2"
                                    onClick={cancelModelSelection}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="w-1/2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium"
                                    onClick={confirmModelSelection}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}



            </div>
        </div>
    );
};

export default ChatPage;
