import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AudioRecording } from '@shared/schema';

interface AudioListProps {
  recordings: AudioRecording[];
  isLoading: boolean;
  showControls?: boolean;
  onPlay?: (recording: AudioRecording) => void;
  onRename?: (recording: AudioRecording) => void;
  onDelete?: (recording: AudioRecording) => void;
  onDownload?: (recording: AudioRecording) => void;
  emptyMessage?: string;
}

const AudioList: React.FC<AudioListProps> = ({
  recordings,
  isLoading,
  showControls = true,
  onPlay,
  onRename,
  onDelete,
  onDownload,
  emptyMessage = "No recordings available"
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="py-3 flex flex-wrap items-center">
            <div className="w-full flex items-center">
              <Skeleton className="flex-shrink-0 rounded-full w-8 h-8 mr-3" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              {showControls && <Skeleton className="ml-2 w-6 h-6" />}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <p className="py-4 text-center text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {recordings.map((recording) => (
        <li key={recording.id} className="py-3 flex flex-wrap items-center">
          <div className="w-full flex items-center">
            <div className="flex-shrink-0 rounded-full w-8 h-8 bg-primary-light flex items-center justify-center text-white mr-3">
              <span className="material-icons text-sm">music_note</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{recording.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(recording.dateRecorded)} • {formatDuration(recording.duration)}
              </p>
            </div>
            {showControls ? (
              <div className="flex items-center space-x-2">
                {onPlay && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => onPlay(recording)}
                  >
                    <span className="material-icons">play_circle</span>
                  </Button>
                )}
                {onRename && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => onRename(recording)}
                  >
                    <span className="material-icons">edit</span>
                  </Button>
                )}
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => onDownload(recording)}
                  >
                    <span className="material-icons">download</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-destructive"
                    onClick={() => onDelete(recording)}
                  >
                    <span className="material-icons">delete</span>
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => onPlay && onPlay(recording)}
              >
                <span className="material-icons">play_circle</span>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default AudioList;
