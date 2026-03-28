import { useEffect, useRef, useCallback } from 'react';

/**
 * useHandDetection
 *
 * Loads MediaPipe Hands, attaches it to a <video> element, draws
 * landmarks on a <canvas>, and calls onLandmarks(landmarks21) every frame.
 *
 * Returns { startCamera, stopCamera }
 */
export function useHandDetection({ videoRef, canvasRef, onLandmarks, onError, enabled = true }) {
  const handsRef  = useRef(null);
  const cameraRef = useRef(null);
  const rafRef    = useRef(null);

  const drawLandmarks = useCallback((ctx, landmarks, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Connection indices from MediaPipe Hands
    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17],
    ];

    // Draw connections
    ctx.strokeStyle = '#5DCAA5';
    ctx.lineWidth   = 2;
    for (const [a, b] of CONNECTIONS) {
      const pa = landmarks[a], pb = landmarks[b];
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.stroke();
    }

    // Draw dots
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1D9E75';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, []);

  const startCamera = useCallback(async () => {
    console.log('[useHandDetection] startCamera called, enabled=', enabled);

    if (!videoRef?.current) {
      const err = new Error('[useHandDetection] Video element not available');
      console.error('[useHandDetection] ERROR: ', err);
      onError?.(err);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error('[useHandDetection] Browser does not support camera access');
      console.error('[useHandDetection] ERROR: ', err);
      onError?.(err);
      return;
    }

    try {
      console.log('[useHandDetection] importing mediapipe modules');
      const { Hands }        = await import('@mediapipe/hands');
      const { Camera }       = await import('@mediapipe/camera_utils');
      console.log('[useHandDetection] modules imported');

      const hands = new Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });

      hands.setOptions({
        maxNumHands:        1,
        modelComplexity:    1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence:  0.5,
      });

      hands.onResults(results => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
          onLandmarks && onLandmarks(landmarks);
        } else {
          console.debug('[useHandDetection] no hand landmarks on current frame');
        }
      });

      await hands.initialize();
      console.log('[useHandDetection] hands initialized');
      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640, height: 480,
      });

      console.log('[useHandDetection] starting camera');
      await camera.start();
      cameraRef.current = camera;
      console.log('[useHandDetection] camera started');
    } catch (err) {
      console.error('[useHandDetection] Failed to start camera:', err);
      onError?.(err);
    }
  }, [enabled, videoRef, canvasRef, onLandmarks, onError, drawLandmarks]);

  const stopCamera = useCallback(() => {
    console.log('[useHandDetection] stopCamera called');
    cameraRef.current?.stop();
    handsRef.current?.close();
    cameraRef.current = null;
    handsRef.current  = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { startCamera, stopCamera };
}
