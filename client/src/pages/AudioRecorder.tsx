import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import AudioRecorderControl from "../components/audio/AudioRecorderControl";
import AudioList from "../components/audio/AudioList";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import { apiRequest } from "@/lib/queryClient";

const AudioRecorder = () => {
  const [recordingName, setRecordingName] = useState("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
  const { 
    isRecording, 
    isPaused, 
    recordingTime, 
    recordingBlob,
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording,
    recordingProgress
  } = useAudioRecorder();

  const { data: recentRecordings, isLoading } = useQuery({
    queryKey: ['/api/audio-recordings'],
    select: (data) => data.slice(0, 4),
    staleTime: 10000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!recordingBlob || !recordingName) {
        throw new Error("Missing recording data or name");
      }
      
      const formData = new FormData();
      formData.append('audio', recordingBlob, 'recording.webm');
      formData.append('name', recordingName);
      formData.append('duration', String(recordingTime));
      
      const response = await fetch('/api/audio-recordings', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to save recording');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audio-recordings'] });
      setRecordingName("");
      setAudioPreviewUrl(null);
    }
  });
  
  const handleStopRecording = async () => {
    const blob = await stopRecording();
    const url = URL.createObjectURL(blob);
    setAudioPreviewUrl(url);
  };
  
  const handleSaveRecording = () => {
    if (recordingName.trim() === "") {
      setRecordingName(`Recording ${new Date().toLocaleString()}`);
    }
    saveMutation.mutate();
  };

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Audio Recording</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Record, save and manage audio notes</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AudioRecorderControl
            isRecording={isRecording}
            isPaused={isPaused}
            recordingTime={recordingTime}
            recordingName={recordingName}
            recordingProgress={recordingProgress}
            isSaving={saveMutation.isPending}
            canSave={!!recordingBlob && !isRecording}
            onRecordingNameChange={setRecordingName}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
            onSaveRecording={handleSaveRecording}
          />
          
          <Card className="mt-6">
            <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
              <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Preview Recorded Audio</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              {audioPreviewUrl ? (
                <audio 
                  className="w-full max-w-md" 
                  controls 
                  src={audioPreviewUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">Record audio to preview it here</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="lg:col-span-1">
          <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
            <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Recent Recordings</CardTitle>
            <a href="/audio-review" className="text-primary hover:text-primary-dark text-sm flex items-center">
              <span>View All</span>
              <i className="material-icons text-base ml-1">arrow_forward</i>
            </a>
          </CardHeader>
          <CardContent className="p-4">
            <AudioList 
              recordings={recentRecordings || []}
              isLoading={isLoading}
              showControls={false}
              emptyMessage="No recent recordings"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AudioRecorder;
