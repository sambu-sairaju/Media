import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { MediaFile } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch videos
  const { data: videos = [], isLoading: loadingVideos } = useQuery<MediaFile[]>({
    queryKey: ['/api/videos'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload video');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Video uploaded successfully",
        description: "Your video has been uploaded and is now available for streaming.",
      });
      
      // Important: Refetch videos after upload
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      // Wait for data to refresh then select the new video
      setTimeout(() => {
        if (data?.id) {
          setCurrentVideoId(data.id);
        }
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    }
  });

  // Handler for file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('video', file);
      uploadMutation.mutate(formData);
    }
  };

  // Current selected video
  const currentVideo = videos.find(v => v.id === currentVideoId) || videos[0];
  
  // If we have videos but no selection, select the first one
  if (videos.length > 0 && !currentVideoId && currentVideo) {
    setCurrentVideoId(currentVideo.id);
  }

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
            disabled={uploadMutation.isPending}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-md"
          >
            <i className="material-icons mr-2">upload</i>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Video'}
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
              {loadingVideos ? (
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
              {loadingVideos ? (
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
