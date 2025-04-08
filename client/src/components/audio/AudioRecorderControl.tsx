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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-100 dark:border-gray-700">
      <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-gray-700 dark:text-gray-200 font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Record New Audio</h2>
      </div>
      <div className="p-6 flex flex-col items-center">
        <Progress 
          value={recordingProgress} 
          className="w-full max-w-md bg-gray-100 dark:bg-gray-700 h-5 mb-6"
        />
        
        <div className="text-center mb-8">
          <div className="text-5xl font-mono bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-2 font-semibold">
            {formatTime(recordingTime)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Recording time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            id="record-button"
            variant={isRecording ? "secondary" : "destructive"}
            size="lg"
            className={`rounded-full w-16 h-16 flex items-center justify-center shadow-md ${
              isRecording 
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700' 
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            <span className="material-icons">{isRecording ? 'stop' : 'mic'}</span>
          </Button>
          
          <Button 
            id="pause-button"
            variant="secondary"
            className={`text-gray-700 dark:text-gray-200 font-medium rounded-full w-12 h-12 flex items-center justify-center shadow-md disabled:opacity-50 ${
              isPaused 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600' 
                : 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700'
            }`}
            disabled={!isRecording}
            onClick={isPaused ? onResumeRecording : onPauseRecording}
          >
            <span className="material-icons">{isPaused ? 'play_arrow' : 'pause'}</span>
          </Button>
          
          {isRecording && !isPaused &&
            <Button 
              id="stop-button"
              variant="secondary"
              className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-full w-12 h-12 flex items-center justify-center shadow-md"
              onClick={onStopRecording}
            >
              <span className="material-icons">stop</span>
            </Button>
          }
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
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-r-md flex items-center disabled:opacity-50 shadow-md"
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
