import React from "react";

const AboutPage = () => {
  return (
    <div className="bg-[#d9e4eb] min-h-screen flex flex-col">
      {/* Header Section */}
      <header className="flex justify-between items-center px-6 md:px-12 py-4 bg-transparent absolute w-full z-10">
        <div className="text-2xl font-bold">MINDSPARK</div>
        <nav className="hidden md:flex space-x-8">
          <a href="/" className="text-gray-600 font-medium hover:text-black">Home</a>
          <a href="#team" className="text-gray-600 font-medium hover:text-black">Team</a>
          <a href="#vision" className="text-gray-600 font-medium hover:text-black">Vision</a>
          <a href="#mission" className="text-gray-600 font-medium hover:text-black">Mission</a>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="text-center mt-24 md:mt-32 px-6 md:px-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
          About <span className="text-black">Mindspark</span>
        </h1>
        <p className="mt-6 text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
          Mindspark is revolutionizing mental healthcare through advanced AI technologies.
          We aim to bridge the gap between innovation and compassionate treatment,
          creating a brighter future for mental health patients worldwide.
        </p>
      </div>

      {/* Team Section */}
      <section id="team" className="mt-16 md:mt-24 px-6 md:px-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Meet Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 justify-center">
          {[
            { name: "Ammad Aslam", role: "Full Stack Developer" },
            { name: "Mutaiba Mohsin", role: "AI Specialist" },
            { name: "Uswa Arif", role: "Frontend Developer" },
            { name: "Fatima Muskan", role: "AI Specialist" }
          ].map((member, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="h-24 w-24 rounded-full bg-gray-300 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-gray-600">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="bg-[#f4f9fd] py-16 mt-16 px-6 md:px-12 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Vision</h2>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
          Our vision is to lead the transformation of mental healthcare by integrating 
          cutting-edge AI technology with patient-centered care, ensuring accessibility and effectiveness.
        </p>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-16 px-6 md:px-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Mission</h2>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-lg text-gray-600 text-lg">
            <p>
              At Mindspark, our mission is to empower healthcare providers with the tools and insights
              to deliver timely, accurate, and empathetic care. We strive to make mental healthcare 
              accessible, reliable, and transformative.
            </p>
          </div>
          <div>
            <img src="/assets/mission-image.png" alt="Mission" className="max-w-xs md:max-w-sm rounded-lg shadow-md"/>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-gray-800 text-white text-center">
        <p>&copy; {new Date().getFullYear()} Mindspark. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
