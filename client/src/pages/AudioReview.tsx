import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import AudioPlayer from '../components/audio/AudioPlayer';
import type { AudioRecording } from '@shared/schema';

const AudioReview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [playingRecording, setPlayingRecording] = useState<AudioRecording | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<AudioRecording | null>(null);
  const [newName, setNewName] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(75);
  
  const { toast } = useToast();
  const itemsPerPage = 5;

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['/api/audio-recordings'],
    staleTime: 10000,
  });
  
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number, name: string }) => {
      return apiRequest('PATCH', `/api/audio-recordings/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audio-recordings'] });
      toast({
        title: "Recording renamed",
        description: "The recording has been successfully renamed.",
      });
      setRenameDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error renaming recording",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/audio-recordings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audio-recordings'] });
      toast({
        title: "Recording deleted",
        description: "The recording has been permanently deleted.",
      });
      setDeleteDialogOpen(false);
      if (playingRecording?.id === selectedRecording?.id) {
        setPlayingRecording(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error deleting recording",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openRenameDialog = (recording: AudioRecording) => {
    setSelectedRecording(recording);
    setNewName(recording.name);
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (recording: AudioRecording) => {
    setSelectedRecording(recording);
    setDeleteDialogOpen(true);
  };

  const handleRename = () => {
    if (selectedRecording && newName.trim()) {
      renameMutation.mutate({ id: selectedRecording.id, name: newName.trim() });
    }
  };

  const handleDelete = () => {
    if (selectedRecording) {
      deleteMutation.mutate(selectedRecording.id);
    }
  };

  const handlePlay = (recording: AudioRecording) => {
    setPlayingRecording(recording);
  };

  const handleDownload = (recording: AudioRecording) => {
    window.open(`/api/audio-recordings/${recording.id}/download`, '_blank');
  };
  
  const filteredRecordings = recordings ? recordings.filter(recording => {
    // Search by name
    const matchesSearch = recording.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by time
    let matchesTimeFilter = true;
    const recordingDate = new Date(recording.dateRecorded);
    const now = new Date();
    
    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesTimeFilter = recordingDate >= weekAgo;
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      matchesTimeFilter = recordingDate >= monthAgo;
    } else if (timeFilter === 'last-month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      matchesTimeFilter = recordingDate >= twoMonthsAgo && recordingDate <= oneMonthAgo;
    }
    
    return matchesSearch && matchesTimeFilter;
  }) : [];
  
  // Pagination
  const totalPages = Math.ceil((filteredRecordings?.length || 0) / itemsPerPage);
  const paginatedRecordings = filteredRecordings?.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

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

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Audio Review</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and review all your recorded audio files</p>
      </header>
      
      <Card className="mb-6">
        <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700 flex flex-wrap items-center justify-between">
          <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">All Audio Recordings</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
              <Input 
                type="text" 
                className="pl-10" 
                placeholder="Filter recordings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Recordings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recordings</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900">
              <TableRow>
                <TableHead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</TableHead>
                <TableHead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="flex-shrink-0 rounded-full w-8 h-8 mr-4" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedRecordings?.length > 0 ? (
                paginatedRecordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 rounded-full w-8 h-8 bg-primary-light flex items-center justify-center text-white">
                          <span className="material-icons text-sm">music_note</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{recording.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(recording.dateRecorded)}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatDuration(recording.duration)}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{(recording.size / (1024 * 1024)).toFixed(1)} MB</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePlay(recording)} className="text-primary hover:text-primary-dark">
                          <span className="material-icons">play_arrow</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openRenameDialog(recording)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                          <span className="material-icons">edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(recording)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                          <span className="material-icons">download</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(recording)} className="text-destructive hover:text-red-700">
                          <span className="material-icons">delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No audio recordings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredRecordings.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredRecordings.length}</span> results
                </p>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 3) }).map((_, i) => {
                    // For simplicity, show max 3 pages
                    let pageNum = i + 1;
                    if (totalPages > 3 && currentPage > 2) {
                      pageNum = currentPage - 1 + i;
                      if (pageNum > totalPages) pageNum = totalPages - 2 + i;
                    }
                    if (pageNum <= totalPages) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>
      
      {playingRecording && (
        <Card>
          <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
            <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Now Playing</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AudioPlayer 
              recording={playingRecording}
              playbackRate={playbackRate}
              volume={volume}
              onPlaybackRateChange={setPlaybackRate}
              onVolumeChange={setVolume}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Recording</DialogTitle>
            <DialogDescription>
              Enter a new name for this recording.
            </DialogDescription>
          </DialogHeader>
          <Input
            id="recording-new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AudioReview;
