import { useState } from "react";

// Image paths from public folder
const heroImage = "/hero.png";
const galleryImage1 = "/gallery-1.png";
const galleryImage2 = "/gallery-2.png";
const mainContentImage = "/main-content.png";
const gridImage1 = "/grid-1.png";
const gridImage2 = "/grid-2.png";
const gridImage3 = "/grid-3.png";
const gridImage4 = "/grid-4.png";
const gridImage5 = "/grid-5.png";
const gridImage6 = "/grid-6.png";
const gridImage7 = "/grid-7.png";
const gridImage8 = "/grid-8.png";
const amberLogo = "/AMBER-LOGO.svg";

type LandingProps = {
  onRegisterClick: () => void;
  onLoginClick: () => void;
};

export default function Landing({
  onRegisterClick,
  onLoginClick,
}: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const gridImages = [
    gridImage1, // Zoom in
    gridImage2, // Still dripping
    gridImage3, // Almost naked
    gridImage4, // Caught again
    gridImage5, // Touch me
    gridImage6, // Want more?
    gridImage7, // Getting wetter
    gridImage8, // Say please
  ];

  return (
    <div className="min-h-screen bg-black text-white w-full overflow-x-hidden">
      {/* Header */}
      <header className="w-full bg-black border-b border-gray-800">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              {amberLogo ? (
                <img src={amberLogo} alt="Amber Logo" className="h-8 w-auto" />
              ) : (
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">🔥</span>
                </div>
              )}
              <span className="text-white font-bold text-lg">
                SPEAK WITH AMBER
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={onLoginClick}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 w-full">
            <div className="w-full px-4 py-4 space-y-4">
              <button
                onClick={onLoginClick}
                className="block w-full text-left text-gray-300 hover:text-white"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 md:p-12 mb-8">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-6 flex items-center justify-center">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt="Amber Hero"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="text-gray-400 text-lg font-medium">
                  Hero Image Placeholder
                </div>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Say hi... let's make this nasty.
              </h1>
              <button
                onClick={onRegisterClick}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors"
              >
                Chat now for free!
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Want to See More Section */}
      <section className="relative bg-gradient-to-br from-red-900/20 to-black py-16 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Gallery */}
            <div className="lg:w-1/2">
              <div className="flex space-x-4 overflow-x-auto pb-4">
                <div className="flex-shrink-0">
                  <div className="w-64 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-2 flex items-center justify-center">
                    {galleryImage1 ? (
                      <img
                        src={galleryImage1}
                        alt="No Panties Today"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-gray-400 font-medium">
                        No Panties Today
                      </div>
                    )}
                  </div>
                  <p className="text-white text-center">No Panties Today</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-64 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-2 flex items-center justify-center relative">
                    {galleryImage2 ? (
                      <img
                        src={galleryImage2}
                        alt="Only If You Beg"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-gray-400 font-medium">
                        Only If You Beg
                      </div>
                    )}
                    <div className="absolute right-2 top-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-white text-center">Only If You Beg</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Want to See More?
              </h2>
              <p className="text-xl text-red-300 mb-4">
                Say the Right Words and It's Yours
              </p>
              <p className="text-gray-300 mb-8 text-lg">
                I don't just tease-I reward. Chat with me to unlock what you
                really want.
              </p>
              <button
                onClick={onRegisterClick}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors"
              >
                Chat now for free!
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Image */}
      <section className="py-16 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 md:p-12">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
              {mainContentImage ? (
                <img
                  src={mainContentImage}
                  alt="Amber Main Content"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="text-gray-400 text-lg font-medium">
                  Main Content Image Placeholder
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* See More of ME Section */}
      <section className="relative bg-gradient-to-br from-red-900/20 to-black py-16 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              See More of ME
            </h2>
            <p className="text-xl text-red-300">
              A little tease before you please.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              "Zoom in",
              "Still dripping",
              "Almost naked",
              "Caught again",
              "Touch me",
              "Want more?",
              "Getting wetter",
              "Say please",
            ].map((title, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                  {gridImages[index] ? (
                    <img
                      src={gridImages[index]}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-gray-400 font-medium text-center px-2">
                      {title}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">{title}</p>
                  <p className="text-red-400 font-bold">$280</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onRegisterClick}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors"
            >
              Chat now for free!
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              {amberLogo ? (
                <img src={amberLogo} alt="Amber Logo" className="h-6 w-auto" />
              ) : (
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-xs">🔥</span>
                </div>
              )}
              <span className="text-white font-bold">SPEAK WITH AMBER</span>
            </div>

            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>Copyright 2025 | SPEAK WITH AMBER All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
