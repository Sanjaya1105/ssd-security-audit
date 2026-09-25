import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';

const NavbarAfterLogging = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/80 backdrop-blur-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/homeafterlogging" className="text-3xl font-bold text-white hover:text-green-400 transition-colors duration-300">
              Hot-Fast
            </Link>
          </div>

          {/* Desktop Menu - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            <Link to="/homeafterlogging" className="text-lg font-medium text-white hover:text-green-400 transition-colors duration-300 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link to="/about" className="text-lg font-medium text-white hover:text-green-400 transition-colors duration-300 relative group">
              About
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link to="/services" className="text-lg font-medium text-white hover:text-green-400 transition-colors duration-300 relative group">
              Services
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link to="/feedback" className="text-lg font-medium text-white hover:text-green-400 transition-colors duration-300 relative group">
              Feedback
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
          </div>

          {/* Login/Signup/Profile Buttons */}
          <div className="hidden md:flex items-center space-x-4">
  <Link 
    to="/profile" 
    className="text-lg font-medium text-white hover:text-green-400 transition-all duration-300 p-2 rounded-full hover:bg-white/10 flex items-center gap-2"
  >
    <FaUser className="text-xl" />
    <span className="text-white hover:text-green-400">My Orders</span>
  </Link>
</div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
            >
              <svg
                className="h-7 w-7"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-black/90 backdrop-blur-lg rounded-lg mt-2">
            <Link
              to="/homeafterlogging"
              className="block px-3 py-2.5 text-lg font-medium text-white hover:text-green-400 hover:bg-white/5 rounded-lg transition-all duration-300"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2.5 text-lg font-medium text-white hover:text-green-400 hover:bg-white/5 rounded-lg transition-all duration-300"
            >
              About
            </Link>
            <Link
              to="/services"
              className="block px-3 py-2.5 text-lg font-medium text-white hover:text-green-400 hover:bg-white/5 rounded-lg transition-all duration-300"
            >
              Services
            </Link>
            <Link
              to="/feedback"
              className="block px-3 py-2.5 text-lg font-medium text-white hover:text-green-400 hover:bg-white/5 rounded-lg transition-all duration-300"
            >
              Feedback
            </Link>
            <div className="pt-4 space-y-2">
              <Link
                to="/profile"
                className="block w-full px-3 py-2.5 text-lg font-medium text-white hover:text-green-400 text-center rounded-lg border border-white/20 hover:bg-white/5 transition-all duration-300"
              >
                Profile
              </Link>
              <Link
                to="/login"
                className="block w-full px-3 py-2.5 text-lg font-medium text-white hover:text-green-400 text-center rounded-lg border border-white/20 hover:bg-white/5 transition-all duration-300"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarAfterLogging; 