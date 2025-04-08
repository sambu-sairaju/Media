import { Link, useLocation } from "wouter";

const navigationItems = [
  { href: "/video", icon: "videocam", label: "Video" },
  { href: "/pdf", icon: "picture_as_pdf", label: "PDF" },
  { href: "/audio-record", icon: "mic", label: "Record" },
  { href: "/webgl", icon: "3d_rotation", label: "WebGL" },
  { href: "/audio-review", icon: "library_music", label: "Review" },
];

const MobileNav = () => {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-10">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center p-3 ${isActive ? "text-primary" : "text-gray-700 hover:text-primary"}`}
            >
              <span className="material-icons">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
