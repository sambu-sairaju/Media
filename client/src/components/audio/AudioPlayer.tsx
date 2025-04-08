import React, { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AudioRecording } from '@shared/schema';

interface AudioPlayerProps {
  recording: AudioRecording;
  playbackRate: number;
  volume: number;
  onPlaybackRateChange: (rate: number) => void;
  onVolumeChange: (volume: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  recording,
  playbackRate,
  volume,
  onPlaybackRateChange,
  onVolumeChange
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    // Event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [recording]);

  // Update playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Play/pause the audio
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Skip forward/backward 10 seconds
  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + amount));
    }
  };

  // Handle seeking through the track
  const handleSeek = (newProgress: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (newProgress[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(newProgress[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center text-white mb-4 shadow-md">
        <span className="material-icons text-3xl">music_note</span>
      </div>
      
      <h3 className="text-lg font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-1">{recording.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {new Date(recording.dateRecorded).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>
      
      <audio 
        ref={audioRef}
        src={`/api/audio-recordings/${recording.id}/stream`}
        preload="metadata"
        hidden
      />
      
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-12 text-right pr-2">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 mx-2">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="h-3"
            />
          </div>
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-12 pl-2">
            {formatTime(duration)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <Button
          variant="ghost"
          className="text-primary hover:text-primary-dark rounded-full hover:bg-primary/10"
          onClick={() => skip(-10)}
        >
          <span className="material-icons text-xl">replay_10</span>
        </Button>
        <Button
          className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-md"
          onClick={togglePlayPause}
        >
          <span className="material-icons text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </Button>
        <Button
          variant="ghost"
          className="text-primary hover:text-primary-dark rounded-full hover:bg-primary/10"
          onClick={() => skip(10)}
        >
          <span className="material-icons text-xl">forward_10</span>
        </Button>
      </div>
      
      <div className="flex items-center mt-6 space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="text-primary hover:text-primary-dark"
            size="sm"
          >
            <span className="material-icons">volume_up</span>
          </Button>
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => onVolumeChange(value[0])}
            className="w-24 h-2"
          />
        </div>
        
        <div className="h-8 border-l border-gray-200 dark:border-gray-700"></div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="text-primary hover:text-primary-dark"
            size="sm"
          >
            <span className="material-icons">speed</span>
          </Button>
          <Select
            value={playbackRate.toString()}
            onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
          >
            <SelectTrigger className="text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded py-1 px-2 text-gray-700 dark:text-gray-200 w-20 h-8">
              <SelectValue placeholder="1x" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
