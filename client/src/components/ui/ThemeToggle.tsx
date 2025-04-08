import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import useTheme from "@/hooks/useTheme";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Button 
      id="theme-toggle" 
      variant="outline"
      className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      onClick={toggleTheme}
    >
      <i className="material-icons mr-2">{isDarkMode ? "light_mode" : "dark_mode"}</i>
      <span>{isDarkMode ? "Light" : "Dark"} Mode</span>
    </Button>
  );
};

export default ThemeToggle;
