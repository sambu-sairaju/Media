import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface AudioRecorderControlProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  recordingName: string;
  recordingProgress: number;
  canSave: boolean;
  isSaving: boolean;
  onRecordingNameChange: (name: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => Promise<Blob>;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onSaveRecording: () => void;
}

const AudioRecorderControl: React.FC<AudioRecorderControlProps> = ({
  isRecording,
  isPaused,
  recordingTime,
  recordingName,
  recordingProgress,
  canSave,
  isSaving,
  onRecordingNameChange,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onSaveRecording
}) => {
  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-gray-700 dark:text-gray-200 font-medium">Record New Audio</h2>
      </div>
      <div className="p-6 flex flex-col items-center">
        <Progress 
          value={recordingProgress} 
          className="w-full max-w-md bg-gray-100 dark:bg-gray-700 h-4 mb-6"
        />
        
        <div className="text-center mb-8">
          <div className="text-4xl font-mono text-gray-700 dark:text-gray-200 mb-2">
            {formatTime(recordingTime)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Recording time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            id="record-button"
            variant={isRecording ? "secondary" : "destructive"}
            size="lg"
            className={`rounded-full w-16 h-16 flex items-center justify-center ${
              isRecording ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            <span className="material-icons">{isRecording ? 'stop' : 'mic'}</span>
          </Button>
          
          <Button 
            id="pause-button"
            variant="secondary"
            className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50"
            disabled={!isRecording || !isPaused}
            onClick={isPaused ? onResumeRecording : onPauseRecording}
          >
            <span className="material-icons">{isPaused ? 'play_arrow' : 'pause'}</span>
          </Button>
          
          <Button 
            id="stop-button"
            variant="secondary"
            className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50"
            disabled={!isRecording}
            onClick={onStopRecording}
          >
            <span className="material-icons">stop</span>
          </Button>
        </div>
        
        <div className="mt-8 w-full max-w-md">
          <label htmlFor="recording-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Recording Name
          </label>
          <div className="flex">
            <Input
              id="recording-name"
              type="text"
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-l-md py-2 px-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Meeting notes"
              value={recordingName}
              onChange={(e) => onRecordingNameChange(e.target.value)}
            />
            <Button
              id="save-recording"
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-r-md flex items-center disabled:opacity-50"
              disabled={!canSave || isSaving}
              onClick={onSaveRecording}
            >
              <span className="material-icons mr-1">save</span>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderControl;
