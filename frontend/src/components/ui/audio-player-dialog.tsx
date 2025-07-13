'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  RotateCcw,
  FastForward,
  Rewind,
  Clock,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callUuid: string;
  callInfo: {
    caller: string;
    destination: string;
    duration: string;
    timestamp: string;
    callUuid: string;
  };
}

export function AudioPlayerDialog({
  isOpen,
  onClose,
  callUuid,
  callInfo
}: AudioPlayerDialogProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string>('');

  // Load authenticated audio URL when dialog opens
  useEffect(() => {
    if (isOpen && callUuid) {
      setIsLoading(true);

      // Import cdrService dynamically to avoid circular dependency
      import('@/services/cdr.service').then(({ cdrService }) => {
        cdrService.getRecordingUrlWithAuth(callUuid)
          .then((url) => {
            setAudioUrl(url);
          })
          .catch((error) => {
            console.error('Failed to load recording:', error);
            setIsLoading(false);
          });
      });
    } else if (!isOpen) {
      // Cleanup when closing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);

      // Cleanup blob URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl('');
      }
    }
  }, [isOpen, callUuid]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
    }
  }, [isOpen]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current || isLoading) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      // Import cdrService dynamically
      const { cdrService } = await import('@/services/cdr.service');
      const downloadUrl = await cdrService.getRecordingUrlWithAuth(callUuid);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `recording_${callInfo.callUuid}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup the blob URL
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download recording:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Call Recording Player
          </DialogTitle>
        </DialogHeader>

        {/* Call Information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Caller</div>
            <div className="font-semibold">{callInfo.caller}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Destination</div>
            <div className="font-semibold">{callInfo.destination}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Duration</div>
            <div className="font-semibold">{callInfo.duration}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Time</div>
            <div className="font-semibold">{callInfo.timestamp}</div>
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          preload="metadata"
        />

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isLoading}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => skipTime(-10)}
            disabled={isLoading}
          >
            <Rewind className="h-4 w-4" />
          </Button>

          <Button
            size="lg"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="h-12 w-12 rounded-full"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => skipTime(10)}
            disabled={isLoading}
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "ghost"}
                size="sm"
                onClick={() => changePlaybackRate(rate)}
                className="text-xs px-2"
              >
                {rate}x
              </Button>
            ))}
          </div>

          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {isLoading ? 'Loading audio...' : `Playing at ${playbackRate}x speed`}
        </div>
      </DialogContent>
    </Dialog>
  );
}
