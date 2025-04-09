import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { MediaFile } from "@shared/schema";
import VideoCard from "../components/video/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const VideoPlayer = () => {
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: videos = [], isLoading: loadingVideos } = useQuery<MediaFile[]>({
    queryKey: ['/api/videos'],
    staleTime: 60000, // 1 minute
  });

  const { data: selectedVideo, isLoading: loadingSelectedVideo } = useQuery<MediaFile>({
    queryKey: ['/api/videos', selectedVideoId],
    enabled: !!selectedVideoId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: "Video uploaded successfully",
        description: "Your video has been uploaded and is now available for streaming.",
      });
      setSelectedVideoId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    }
  });

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('video', file);
      uploadMutation.mutate(formData);
    }
  };

  // Select first video by default when videos are loaded
  useEffect(() => {
    if (videos?.length && !selectedVideoId) {
      setSelectedVideoId(videos[0].id);
    }
  }, [videos, selectedVideoId]);

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Video Streaming</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Stream videos directly without downloading</p>
        </div>
        <div>
          <Button
            onClick={handleUpload}
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex flex-wrap items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {loadingSelectedVideo ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
              {selectedVideo?.originalName || "Select a video"}
            </h2>
          )}
          {loadingSelectedVideo ? (
            <div className="flex items-center">
              <Skeleton className="h-4 w-32 mr-3" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : selectedVideo && (
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">
                Duration: {selectedVideo && selectedVideo.duration ? `${Math.floor(selectedVideo.duration / 60)}:${String(selectedVideo.duration % 60).padStart(2, '0')}` : '0:00'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedVideo?.resolution || 'Unknown'}
              </span>
            </div>
          )}
        </div>

        <div className="bg-black aspect-video w-full">
          {loadingSelectedVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <i className="material-icons text-6xl text-gray-600 animate-pulse">videocam</i>
            </div>
          ) : selectedVideo ? (
            <video
              className="w-full h-full"
              controls
              autoPlay
              src={`/api/videos/${selectedVideo?.id}/stream`}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-gray-400">No video selected</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedVideo && (
          <Card>
            <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
              <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Video Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <dl className="grid grid-cols-1 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{selectedVideo?.originalName || 'Untitled'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                    {selectedVideo?.size ? `${Math.round(selectedVideo.size / (1024 * 1024) * 10) / 10} MB` : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                    {selectedVideo?.uploadDate 
                      ? new Date(selectedVideo.uploadDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{selectedVideo?.mimeType || 'Unknown'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
            <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">More Videos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loadingVideos ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="py-3 flex items-center">
                    <Skeleton className="w-16 h-9 mr-3" />
                    <div>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : videos?.length ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {videos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    isActive={video.id === selectedVideoId}
                    onClick={() => setSelectedVideoId(video.id)} 
                  />
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-gray-500 dark:text-gray-400">No videos available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VideoPlayer;
