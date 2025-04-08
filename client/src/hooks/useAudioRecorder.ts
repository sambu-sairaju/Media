import { useState, useEffect, useRef } from 'react';

const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const startRecording = async () => {
    try {
      chunksRef.current = [];
      setRecordingBlob(null);
      setRecordingTime(0);
      setRecordingProgress(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
        stopMediaTracks();
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      
      // Start timer
      timerRef.current = setInterval(() => {
        const currentTime = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setRecordingTime(currentTime);
        
        // Update progress (for visual feedback, assumes 2 minute max recording)
        const progress = Math.min(100, (currentTime / 120) * 100);
        setRecordingProgress(progress);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Store the pause start time
      pausedTimeRef.current -= Date.now();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Calculate paused duration and add to offset
      pausedTimeRef.current += Date.now();
      
      // Restart timer
      timerRef.current = setInterval(() => {
        const currentTime = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setRecordingTime(currentTime);
        
        // Update progress
        const progress = Math.min(100, (currentTime / 120) * 100);
        setRecordingProgress(progress);
      }, 1000);
    }
  };
  
  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const onStopHandler = () => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.removeEventListener('stop', onStopHandler);
          }
          
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setRecordingBlob(blob);
          resolve(blob);
        };
        
        mediaRecorderRef.current.addEventListener('stop', onStopHandler);
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // If not recording, resolve with empty blob
        resolve(new Blob([], { type: 'audio/webm' }));
      }
    });
  };
  
  return {
    isRecording,
    isPaused,
    recordingTime,
    recordingBlob,
    recordingProgress,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
};

export default useAudioRecorder;
