import React, { useState } from "react";
import mainImage from '../assets/main.png';
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "./Config";
import { Menu, X } from "lucide-react";


const LandingPage = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", age: "" });
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate(); // For redirection

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };


  // Toggle modal visibility
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setIsSignUp(false); // Reset to login when modal is closed
    setFormData({ fullName: "", email: "", password: "", age: "" }); // Reset form
    setError(""); // Clear errors
  };

  const switchToSignUp = () => {
    setIsSignUp(true);
  };

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle login & signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Store JWT Token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      // Redirect to chat page (or dashboard)
      navigate("/chat");

    } catch (err) {
      setError(err.message);
    }
  };




  return (
    <div className="bg-[#d9e4eb] min-h-screen flex flex-col pt-5 md:pt-0 overflow-x-hidden">
      {/* Header Section */}
      <header className="fixed top-0 left-0 w-full bg-transparent backdrop-blur-md shadow-md z-50 flex justify-between items-center px-6 md:px-20 py-4 h-16 transition-all duration-300">
        <div className="text-2xl font-bold">MINDSPARK</div>
        <div className="flex items-center space-x-8">
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-gray-600 font-medium hover:text-black">
              Home
            </a>
            <Link to="/about" className="text-gray-600 font-medium hover:text-black">
              About
            </Link>
            <a
              href="#technology"
              className="text-gray-600 font-medium hover:text-black"
            >
              Technology
            </a>
            <a href="#services" className="text-gray-600 font-medium hover:text-black">
              Services
            </a>
          </nav>
          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <button
            onClick={toggleModal}
            className="bg-black text-white px-6 py-2 rounded-full font-semibold hidden md:block">
            Login
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute top-16 left-0 w-full bg-white shadow-lg z-20 p-6 flex flex-col space-y-4 text-center">
            <a href="#home" className="text-gray-600 font-medium hover:text-black">Home</a>
            <Link to="/about" className="text-gray-600 font-medium hover:text-black">About</Link>
            <a href="#technology" className="text-gray-600 font-medium hover:text-black">Technology</a>
            <a href="#services" className="text-gray-600 font-medium hover:text-black">Services</a>
            <button onClick={toggleModal} className="bg-black text-white px-6 py-2 rounded-full font-semibold">Login</button>
          </div>
        </div>

      )}

      {/* Main Content Section */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 mt-20 md:mt-32">
        {/* Left Section */}
        <div className="text-center md:text-left max-w-lg">
          {/* Tagline */}
          <span className="bg-gray-200 text-gray-800 text-xs sm:text-sm md:text-base font-semibold px-3 sm:px-4 py-1 rounded-full block text-center sm:inline">
            World's Most Adopted Mental Healthcare AI
          </span>


          {/* Main Heading */}
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-snug md:leading-tight font-montserrat text-center md:text-left">
            Revolutionizing <br />
            <span className="font-bold">Healthcare</span> With <br />
            <span className="font-bold">AI</span>
          </h1>

          {/* Subtext */}
          <p className="mt-3 text-gray-600 text-base sm:text-lg md:text-xl leading-normal sm:leading-relaxed text-center md:text-left">
            Mindspark helps medical professionals diagnose patients quickly and accurately,
            following DSM-5 guidelines, and ensures timely treatment. By bridging the gap
            between technology and compassionate care, it enhances accessibility and outcomes for
            mental health patients worldwide.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex justify-center md:justify-start space-x-4">
            <button
              className="bg-black text-white px-6 py-3 rounded-full font-semibold"
              onClick={() => {
                const user = localStorage.getItem("token"); // Check if user is logged in
                if (user) {
                  navigate("/chat");
                } else {
                  toggleModal(); // Open the login modal if no user is logged in
                }
              }}
            >
              Open a Chat
            </button>
            <button className="border border-gray-400 text-gray-600 px-6 py-3 rounded-full font-semibold">
              Appointment
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="mt-10 md:mt-0">
          <img
            src={mainImage}
            alt="AI Robotic Hand Holding Brain"
            className="w-full max-w-md md:max-w-lg"
          />
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-sm md:max-w-lg relative">
            <button onClick={toggleModal} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">&times;</button>

            <h2 className="text-2xl font-semibold text-center mb-4">{isSignUp ? "Sign Up" : "Login"}</h2>
            {error && <p className="text-red-500 text-center">{error}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label className="block text-gray-600">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    placeholder="Enter your full name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none" required />
                </div>
              )}
              <div>
                <label className="block text-gray-600">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Enter your email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none" required />
              </div>
              <div>
                <label className="block text-gray-600">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  placeholder="Enter your password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none" required />
              </div>
              {isSignUp && (
                <div>
                  <label className="block text-gray-600">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange}
                    placeholder="Enter your age" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none" required />
                </div>
              )}
              <button type="submit" className="w-full bg-black text-white py-2 rounded-md font-semibold">
                {isSignUp ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <span onClick={switchToSignUp} className="text-black font-medium cursor-pointer">
                  {isSignUp ? "Login" : "Sign Up"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
