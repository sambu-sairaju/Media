import { useEffect, useRef } from 'react';
import type { MediaFile } from '@shared/schema';

interface SimpleVideoPlayerProps {
  video: MediaFile | undefined;
  autoPlay?: boolean;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({ 
  video,
  autoPlay = true
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Reset video src when video changes
  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.load();
    }
  }, [video]);

  if (!video) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <span className="text-gray-400">No video selected</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-full"
      controls
      autoPlay={autoPlay}
      key={`video-${video.id}`} // Force remount when video changes
    >
      <source 
        src={`/api/videos/${video.id}/stream`}
        type={video.mimeType} 
      />
      Your browser does not support the video tag.
    </video>
  );
};

export default SimpleVideoPlayer;