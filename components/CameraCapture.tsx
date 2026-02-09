import React, { useRef, useEffect, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("無法存取相機。");
        onCancel();
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-crimson/95 flex flex-col items-center justify-center p-4">
      {/* Decorative corners for the modal */}
      <div className="fixed top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-gold opacity-50"></div>
      <div className="fixed bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-gold opacity-50"></div>

      <div className="relative w-full max-w-lg aspect-[3/4] bg-black shadow-paper-3 overflow-hidden rounded-lg ring-1 ring-gold/50">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* AR Guide Overlay - Golden Ratio / Elegant */}
        <div className="absolute inset-0 pointer-events-none p-6">
            <div className="w-full h-full border border-white/20 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold"></div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">
                     <div className="text-white/90 font-serif text-shadow-sm tracking-widest uppercase text-xs mb-2">Target Area</div>
                     <div className="w-48 h-64 border border-gold/30 mx-auto rounded-t-full rounded-b-full"></div>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent pt-12 pb-8 px-8 flex justify-between items-center z-10">
            <button 
                onClick={onCancel}
                className="text-white font-serif hover:text-gold transition-colors tracking-wide text-sm"
            >
                取消 Cancel
            </button>
            <button 
                onClick={handleCapture}
                className="w-16 h-16 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-sm hover:bg-gold hover:border-gold transition-all duration-300 shadow-lg flex items-center justify-center group"
            >
                <div className="w-12 h-12 rounded-full bg-white group-hover:scale-90 transition-transform duration-300"></div>
            </button>
            <div className="w-12"></div> {/* Spacer */}
        </div>
      </div>
    </div>
  );
};