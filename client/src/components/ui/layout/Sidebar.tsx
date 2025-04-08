import { Link, useLocation } from "wouter";
import ThemeToggle from "../ThemeToggle";

const navigationItems = [
  { href: "/video", icon: "videocam", label: "Video Streaming" },
  { href: "/pdf", icon: "picture_as_pdf", label: "PDF Viewer" },
  { href: "/audio-record", icon: "mic", label: "Audio Recording" },
  { href: "/webgl", icon: "3d_rotation", label: "WebGL Viewer" },
  { href: "/audio-review", icon: "library_music", label: "Audio Review" },
];

const Sidebar = () => {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
        <span className="material-icons text-primary mr-3">dynamic_feed</span>
        <h1 className="text-xl font-medium text-primary">Media Hub</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-primary hover:text-white rounded mx-2 ${
                    isActive ? "bg-primary text-white" : ""
                  }`}
                >
                  <span className="material-icons mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ThemeToggle />
      </div>
    </aside>
  );
};

export default Sidebar;
