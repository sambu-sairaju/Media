import React from 'react';
import { Button } from '@/components/ui/button';

interface WebGLControlsProps {
  onFullscreen: () => void;
  onReset: () => void;
}

const WebGLControls: React.FC<WebGLControlsProps> = ({ onFullscreen, onReset }) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-1.5 px-3 rounded inline-flex items-center text-sm"
        variant="outline"
        onClick={onFullscreen}
      >
        <span className="material-icons mr-1 text-sm">fullscreen</span>
        <span>Fullscreen</span>
      </Button>
      <Button
        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-1.5 px-3 rounded inline-flex items-center text-sm"
        variant="outline"
        onClick={onReset}
      >
        <span className="material-icons mr-1 text-sm">restart_alt</span>
        <span>Reset View</span>
      </Button>
    </div>
  );
};

export default WebGLControls;
