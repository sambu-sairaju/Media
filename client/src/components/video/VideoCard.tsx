import React from 'react';
import type { MediaFile } from '@shared/schema';

interface VideoCardProps {
  video: MediaFile;
  isActive: boolean;
  onClick: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isActive, onClick }) => {
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResolutionShort = (res?: string) => {
    if (!res) return '';
    if (res.includes('1080')) return '1080p';
    if (res.includes('720')) return '720p';
    if (res.includes('480')) return '480p';
    return res;
  };

  return (
    <li 
      className={`py-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded ${isActive ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-16 h-9 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden mr-3 flex items-center justify-center">
        <span className="material-icons text-gray-400">movie</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{video.originalName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDuration(video.duration)} • {getResolutionShort(video.resolution)}
        </p>
      </div>
    </li>
  );
};

export default VideoCard;
