import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Upload, SwitchCamera } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, fileName: string) => void;
  onFallbackToFileUpload: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFileUpload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Stop media tracks
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Check if device has multiple cameras
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        if (videoDevices.length > 1) {
          setHasMultipleCameras(true);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Start camera stream
  const startCamera = async (currentFacing: 'environment' | 'user') => {
    stopCameraStream();
    setIsStarting(true);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsStarting(false);
      setCameraError(
        'Tu navegador o dispositivo no soporta el acceso directo a la cámara (getUserMedia no disponible). Puedes subir el archivo directamente.'
      );
      return;
    }

    try {
      // First attempt with preferred facing mode
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: currentFacing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Could not open camera with ideal constraints, trying basic video:', firstErr);
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStarting(false);
    } catch (err: unknown) {
      console.error('Error opening camera:', err);
      setIsStarting(false);

      let msg = 'No se pudo acceder a la cámara.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Permiso denegado para acceder a la cámara. Por favor concede permisos en la barra de direcciones de tu navegador.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No se detectó ninguna cámara disponible en tu dispositivo.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'La cámara ya está siendo utilizada por otra aplicación o pestaña.';
        } else {
          msg = `Error de cámara: ${err.message || err.name}`;
        }
      }
      setCameraError(msg);
    }
  };

  // Lifecycle when modal opens/closes or facingMode changes
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCameraStream();
      setCameraError(null);
      setIsStarting(false);
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  // Handle capture frame
  const handleCapturePhoto = () => {
    if (!videoRef.current || isCapturing) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Esperando a que la cámara inicialice el video...');
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo inicializar el contexto de captura');
      }

      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to image/jpeg data URL with high quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const fileName = `Foto_Recibo_${Date.now()}.jpg`;

      // Stop camera and send image to processing pipeline
      stopCameraStream();
      onCapture(dataUrl, fileName);
    } catch (err) {
      console.error('Error capturing photo:', err);
      setCameraError('Ocurrió un error al capturar la imagen. Intenta nuevamente.');
      setIsCapturing(false);
    }
  };

  // Toggle camera facing mode (front/back)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#081512] border border-[#182F2A] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* HEADER CONTROLS */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0B1A16] border-b border-[#182F2A] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center text-[#14B8A6]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tomar foto del comprobante</h3>
              <p className="text-[11px] text-[#7C9791]">
                Enfoca la factura o ticket dentro del recuadro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasMultipleCameras && !cameraError && (
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Cambiar cámara"
                className="p-2 bg-[#11241F] hover:bg-[#1C3A31] text-[#7C9791] hover:text-white rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 bg-[#11241F] hover:bg-[#1C3A31] text-[#7C9791] hover:text-white rounded-xl border border-[#1C3A31] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CAMERA VIEWFINDER / ERROR VIEWPORT */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[440px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 sm:p-8 text-center max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">No pudimos abrir la cámara</h4>
                <p className="text-xs text-[#99B2AC] mt-1.5 leading-relaxed">{cameraError}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#11241F] hover:bg-[#1C3A31] border border-[#1C3A31] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onFallbackToFileUpload();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#14B8A6]/20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir imagen desde archivos</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* VIDEO STREAM */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover sm:object-contain max-h-[60vh] bg-black"
              />

              {/* LOADING SPINNER */}
              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3 text-white">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#14B8A6]" />
                  <p className="text-xs font-semibold text-[#99B2AC]">Iniciando cámara...</p>
                </div>
              )}

              {/* RECEIPT FRAMING GUIDELINES */}
              {!isStarting && (
                <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-dashed border-[#14B8A6]/50 rounded-2xl flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-[#14B8A6]"></span>
                    <span className="w-4 h-4 border-t-2 border-r-2 border-[#14B8A6]"></span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-black/60 text-[#14B8A6] border border-[#14B8A6]/30 backdrop-blur-xs">
                      Alinea el comprobante aquí
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-[#14B8A6]"></span>
                    <span className="w-4 h-4 border-b-2 border-r-2 border-[#14B8A6]"></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        {!cameraError && (
          <div className="p-4 sm:p-5 bg-[#0B1A16] border-t border-[#182F2A] flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#7C9791] hover:text-white bg-[#11241F] hover:bg-[#1C3A31] border border-[#1C3A31] rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            {/* SHUTTER CAPTURE BUTTON */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={isStarting || isCapturing}
                className="group relative flex items-center justify-center p-1.5 rounded-full border-4 border-[#14B8A6]/40 hover:border-[#14B8A6] transition duration-200 cursor-pointer disabled:opacity-50"
                title="Capturar comprobante"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#14B8A6] group-hover:bg-[#0D9488] active:scale-95 transition-all flex items-center justify-center text-[#020504] shadow-lg shadow-[#14B8A6]/30">
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                handleClose();
                onFallbackToFileUpload();
              }}
              className="px-3 py-2 text-xs font-medium text-[#7C9791] hover:text-[#14B8A6] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">O subir archivo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
