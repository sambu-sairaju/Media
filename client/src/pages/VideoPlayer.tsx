import { useState, useRef, useEffect } from "react";
import type { MediaFile } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Super simple video player component
const SimpleVideo = ({ videoSrc }: { videoSrc: string }) => {
  return (
    <video
      className="w-full h-full"
      controls
      autoPlay
      key={videoSrc} // Force remount when src changes
    >
      <source src={videoSrc} />
      Your browser does not support the video tag.
    </video>
  );
};

// Even simpler video card component
const SimpleVideoCard = ({ 
  name, 
  isActive = false, 
  onClick 
}: { 
  name: string; 
  isActive?: boolean; 
  onClick: () => void;
}) => {
  return (
    <div 
      className={`p-2 cursor-pointer rounded ${isActive ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <span className="material-icons mr-2 text-gray-500">movie</span>
        <span className="truncate">{name}</span>
      </div>
    </div>
  );
};

const VideoPlayer = () => {
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch videos directly from API
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched videos:", data);
        setVideos(data || []);
        
        // Auto-select first video if we have videos but no selection
        if (data && data.length > 0 && !currentVideoId) {
          setCurrentVideoId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Upload a video file
  const uploadVideo = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Video uploaded successfully",
          description: "Your video has been uploaded and is now available.",
        });
        
        console.log("Uploaded video data:", data);
        
        // Fetch videos again to update the list
        await fetchVideos();
        
        // Select the newly uploaded video
        if (data && data.id) {
          setCurrentVideoId(data.id);
        }
      } else {
        toast({
          title: "Upload failed",
          description: "There was a problem uploading your video.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Load videos when component mounts
  useEffect(() => {
    fetchVideos();
  }, []);

  // Handler for file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVideo(file);
    }
  };

  // Current selected video
  const currentVideo = videos.find(v => v.id === currentVideoId) || (videos.length > 0 ? videos[0] : null);

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Video Streaming</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Stream videos directly without downloading</p>
        </div>
        <div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-md"
          >
            <i className="material-icons mr-2">upload</i>
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
            onClick={(e) => (e.currentTarget.value = '')}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-100 dark:bg-gray-700">
              <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">
                {currentVideo?.originalName || "No video selected"}
              </CardTitle>
            </CardHeader>
            <div className="bg-black aspect-video w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : currentVideo ? (
                <SimpleVideo videoSrc={`/api/videos/${currentVideo.id}/stream`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <span className="text-gray-400">No videos available</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="py-3 px-4 bg-gray-100 dark:bg-gray-700">
              <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Available Videos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-10 w-full" />
                  ))}
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <SimpleVideoCard
                      key={video.id}
                      name={video.originalName}
                      isActive={video.id === currentVideoId}
                      onClick={() => setCurrentVideoId(video.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No videos available</p>
                  <p className="text-sm mt-2">Upload a video to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default VideoPlayer;