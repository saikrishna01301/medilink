import React from "react";

// Define the type for navigation links for strict type safety
interface NavLinkItem {
  name: string;
  href: string;
}

// Move static data outside the component function to prevent re-creation
// on every render, improving performance slightly.

const NAV_LINKS: NavLinkItem[] = [
  { name: "Teams", href: "/teams" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blogs" },
  { name: "Contact", href: "/contact" },
  { name: "Legal", href: "/legal" },
];

/**
 * Renders the responsive MediHealth footer component.
 * Uses React.memo for performance optimization since the component relies only on static data.
 */
const Footer: React.FC = () => {
  // Tailwind's Inter font is assumed to be available.
  return (
    <footer className="w-full py-16 px-5 flex flex-col items-center text-center sm:py-20 md:px-8 mt-25">
      <div className="max-w-7xl w-full">
        {/* --- 1. Central Logo and Branding --- */}
        <div className="mb-10 sm:mb-12">
          <div className=" flex items-center justify-center font-extrabold mb-1">
            {/* Logo replacement: Use your logo's URL here in the src attribute */}
            <img
              src="/logo.svg"
              alt="MediHealth Company Logo"
              className="w-50 h-10 "
            />
          </div>
          <p className="text-sm text-gray-600 font-medium m-0">
            Healthcare made easy. Life made better
          </p>
        </div>

        {/* --- 2. Main Navigation Links --- */}
        <nav
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-16 sm:gap-x-12 sm:mb-20"
          role="navigation" // Added for accessibility
          aria-label="Footer Navigation Links"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 p-1"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* --- 3. Bottom Legal/Credit Bar (Responsive) --- */}
        <div className="flex flex-col md:flex-row justify-between w-full max-w-6xl pt-6 border-t border-gray-200 gap-3 md:gap-0">
          <p className="text-xs text-gray-500 font-normal order-2 md:order-1">
            Webpage designed and developed by Team - 2
          </p>

          <p className="text-xs text-gray-500 font-normal order-3 md:order-2">
            All copyrights reserved by MediHealth LLC &copy;
          </p>

          {/* Social Prompt */}
          <p className="text-xs text-gray-500 font-medium hover:text-indigo-600 transition-colors order-1 md:order-3 cursor-pointer">
            Follow our GitHub for more
          </p>
        </div>
      </div>
    </footer>
  );
};

// Use React.memo for performance boost as this is a static footer component
export default React.memo(Footer);
