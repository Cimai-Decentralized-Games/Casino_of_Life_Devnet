import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

interface LiveStreamProps {
  fightId: string | null;
  streamUrl: string | null;
}

export const LiveStream: React.FC<LiveStreamProps> = ({ fightId, streamUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hlsError, setHlsError] = useState('');
  const [hlsStatus, setHlsStatus] = useState('Waiting for fight to start');

  useEffect(() => {
    console.log('LiveStream useEffect triggered', { fightId, streamUrl });

    if (videoRef.current && Hls.isSupported() && fightId && streamUrl) {
      if (!hlsRef.current) {
        hlsRef.current = new Hls({
          debug: true,
          enableWorker: true,
          lowLatencyMode: true,
          liveDurationInfinity: true,
          xhrSetup: (xhr, url) => {
            xhr.withCredentials = false; // Ensure CORS requests don't send credentials
          }
        });

        hlsRef.current.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('HLS: Media attached');
        });

        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS: Manifest parsed, ready to play');
          setHlsStatus('Ready to play');
          videoRef.current?.play().catch(error => {
            console.error('Error attempting to play:', error);
            setHlsStatus('Error playing video');
          });
        });

        hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
          console.error(`HLS error: ${data.type}`, data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setHlsStatus('Network error, trying to recover');
                hlsRef.current!.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setHlsStatus('Media error, trying to recover');
                hlsRef.current!.recoverMediaError();
                break;
              default:
                setHlsStatus('Fatal error');
                setHlsError(`Fatal error: ${data.type} - ${data.details}`);
                break;
            }
          } else {
            setHlsStatus(`Non-fatal error: ${data.type} - ${data.details}`);
          }
        });
      }

      hlsRef.current.loadSource(streamUrl);
      hlsRef.current.attachMedia(videoRef.current);
      setHlsStatus('Loading stream');
    } else if (!fightId || !streamUrl) {
      setHlsStatus('Waiting for fight to start');
    }
  }, [fightId, streamUrl]);

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title mb-4">Live Stream</h2>
        <video
          ref={videoRef}
          controls
          className="w-full h-96 rounded-lg"
          playsInline
          muted
        />
        {hlsError && <p className="text-error text-center mt-2">{hlsError}</p>}
        <div className="mt-2">Stream status: <span className="font-semibold">{hlsStatus}</span></div>
      </div>
    </div>
  );
};

export default LiveStream;