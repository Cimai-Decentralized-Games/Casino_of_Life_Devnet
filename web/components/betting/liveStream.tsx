import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface LiveStreamProps {
  fightId: string | null;
  streamUrl: string | null;
  fightStatus: string;
}

const MAX_INIT_ATTEMPTS = 60;
const INIT_DELAY = 5000;
const RETRY_INTERVAL = 5000;
const COOLDOWN_PERIOD = 30000;

export const LiveStream: React.FC<LiveStreamProps> = ({ fightId, streamUrl, fightStatus }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hlsError, setHlsError] = useState('');
  const [hlsStatus, setHlsStatus] = useState('Waiting for fight to start');
  const [streamReady, setStreamReady] = useState(false);
  const initAttemptsRef = useRef(0);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);
  const lastErrorRef = useRef<string>('');

  const initHls = useCallback(() => {
    if (videoRef.current && Hls.isSupported() && fightId && streamUrl) {
      if (!hlsRef.current) {
        hlsRef.current = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          liveDurationInfinity: true,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 3,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 3,
          fragLoadingRetryDelay: 1000,
          defaultAudioCodec: 'mp4a.40.2',
          abrEwmaDefaultEstimate: 500000,
          startLevel: -1,
          autoStartLoad: true,
          xhrSetup: function(xhr, url) {
            xhr.withCredentials = true;
          }
        });

        hlsRef.current.on(Hls.Events.MEDIA_ATTACHED, () => {
          setHlsStatus('Media attached, preparing stream...');
          
          if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
          cooldownTimeoutRef.current = setTimeout(() => {
            initAttemptsRef.current = 0;
          }, COOLDOWN_PERIOD);
        });

        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          setHlsStatus('Ready to play');
          setStreamReady(true);
          isStreamingRef.current = true;
          videoRef.current?.play().catch(() => {
            setHlsStatus('Error playing video');
          });
        });

        hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal || lastErrorRef.current !== data.details) {
            lastErrorRef.current = data.details;
            
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  if (data.details === 'audioTrackLoadError') {
                    hlsRef.current?.recoverMediaError();
                  } else {
                    hlsRef.current?.startLoad();
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hlsRef.current?.recoverMediaError();
                  break;
                default:
                  setHlsError(`Playback error: ${data.details}`);
                  break;
              }
            }
          }
        });
      }

      if (!isStreamingRef.current) {
        hlsRef.current.loadSource(streamUrl);
        hlsRef.current.attachMedia(videoRef.current);
        setHlsStatus(`Loading stream (Attempt ${initAttemptsRef.current + 1}/${MAX_INIT_ATTEMPTS})`);
      }
    } else if (!fightId || !streamUrl) {
      setHlsStatus('Waiting for fight to start');
    }
  }, [fightId, streamUrl]);

  useEffect(() => {
    if (fightStatus === 'in_progress' && !isStreamingRef.current) {
      console.log('Fight started, initializing stream');
    }
    
    setStreamReady(false);
    isStreamingRef.current = false;
    initAttemptsRef.current = 0;
    lastErrorRef.current = '';

    const attemptInit = () => {
      if (initAttemptsRef.current < MAX_INIT_ATTEMPTS) {
        initAttemptsRef.current++;
        initHls();

        if (!streamReady && fightStatus === 'in_progress') {
          setTimeout(attemptInit, RETRY_INTERVAL);
        }
      } else {
        setHlsError(`Failed to initialize stream after ${MAX_INIT_ATTEMPTS} attempts`);
      }
    };

    if (fightId && streamUrl) {
      setTimeout(attemptInit, INIT_DELAY);
    }

    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    };
  }, [fightId, streamUrl, initHls, fightStatus]);

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full">
        <img
          src="/logo.png"
          alt="Stream placeholder"
          className="absolute w-full h-full object-cover"
        />
        <video
          ref={videoRef}
          controls
          className={`absolute w-full h-full ${streamReady ? 'visible' : 'invisible'}`}
          playsInline
          autoPlay
          preload="auto"
        />
        {!streamReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <p className="text-white text-xl text-center">
              {hlsStatus}<br/>
              Please wait...
            </p>
          </div>
        )}
      </div>
      {hlsError && <p className="text-error text-center mt-2">{hlsError}</p>}
      <div className="mt-2">Stream status: <span className="font-semibold">{hlsStatus}</span></div>
    </div>
  );
};

export default LiveStream;
