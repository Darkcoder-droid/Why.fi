import React, { useEffect, useRef, useState } from 'react';
import {
  getRandomMemeAudioForExpression,
  getMemePalette,
  getMemeSceneForExpression,
  getMemeTitle,
  type MemeExpression,
  type MemeScene,
} from '../data/memeMedia';

const EMOJIS = ['happy', 'sad', 'surprise'] as const;
const MAX_SCORE = 5;
const FALLBACK_MEME_SOUND_MS = 1400;
const SNAP_COOLDOWN_MS = 5000;
const SNAP_COOLDOWN_STEPS = 10;

const browserHost = window.location.hostname || 'localhost';
const backendHttpBase = `http://${browserHost}:8001`;
const backendWsBase = `ws://${browserHost}:8001`;

type EmojiName = (typeof EMOJIS)[number];

type WhyMeter = {
  why_score: number;
  boredom: number;
  confusion: number;
  dread: number;
};

type CaptureRecord = {
  expression: EmojiName;
  emojiChar: string;
  imageUrl: string;
  whyMeter: WhyMeter;
};

const DEFAULT_METER: WhyMeter = {
  why_score: 0,
  boredom: 0,
  confusion: 0,
  dread: 0,
};

const getEmojiChar = (name: string) => {
  switch (name) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'surprise':
      return '😲';
    default:
      return '😐';
  }
};

const getEmojiLabel = (name: string) => {
  if (name === 'none') {
    return 'No face';
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
};

const getRandomTarget = (exclude?: string): EmojiName => {
  let target = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  while (exclude && target === exclude) {
    target = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  }

  return target;
};

const isMemeExpression = (emoji: string): emoji is MemeExpression =>
  emoji === 'happy' || emoji === 'sad' || emoji === 'surprise';

const WebcamCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const memeCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sendIntervalRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const targetRef = useRef<EmojiName>('happy');
  const completeRef = useRef(false);
  const savingCaptureRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const memeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeMemeRef = useRef<MemeScene | null>(null);
  const fallbackSoundTimerRef = useRef<number | null>(null);
  const playbackStopTimerRef = useRef<number | null>(null);
  const playbackRequestRef = useRef(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const cooldownIntervalRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);
  const pendingTargetRef = useRef<EmojiName | null>(null);
  const pendingCompletionRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [currentTarget, setCurrentTarget] = useState<EmojiName>('happy');
  const [currentEmoji, setCurrentEmoji] = useState<string>('none');
  const [gameScore, setGameScore] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Match the target face.');
  const [whyMeter, setWhyMeter] = useState<WhyMeter>(DEFAULT_METER);
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [isTrapped, setIsTrapped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [activeMeme, setActiveMeme] = useState<MemeScene | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownStep, setCooldownStep] = useState(0);

  useEffect(() => {
    targetRef.current = currentTarget;
  }, [currentTarget]);

  useEffect(() => {
    scoreRef.current = gameScore;
  }, [gameScore]);

  useEffect(() => {
    completeRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    activeMemeRef.current = activeMeme;
  }, [activeMeme]);

  useEffect(() => {
    cooldownRef.current = isCooldown;
  }, [isCooldown]);

  const stopMemePlayback = () => {
    playbackRequestRef.current += 1;

    if (fallbackSoundTimerRef.current) {
      window.clearTimeout(fallbackSoundTimerRef.current);
      fallbackSoundTimerRef.current = null;
    }

    if (playbackStopTimerRef.current) {
      window.clearTimeout(playbackStopTimerRef.current);
      playbackStopTimerRef.current = null;
    }

    if (memeAudioRef.current) {
      memeAudioRef.current.pause();
      memeAudioRef.current.currentTime = 0;
      memeAudioRef.current = null;
    }
  };

  const clearCooldownTimers = () => {
    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }

    if (cooldownIntervalRef.current) {
      window.clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  };

  const ensureAudioContextReady = async () => {
    if (!audioContextRef.current) {
      return false;
    }

    try {
      if (audioContextRef.current.state !== 'running') {
        await audioContextRef.current.resume();
      }

      return audioContextRef.current.state === 'running';
    } catch {
      return false;
    }
  };

  const unlockAudio = async () => {
    const isReady = await ensureAudioContextReady();
    if (!isReady || !audioContextRef.current) {
      setAudioBlocked(true);
      return false;
    }

    try {
      const now = audioContextRef.current.currentTime;
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      gainNode.gain.setValueAtTime(0.0001, now);
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.02);

      setAudioBlocked(false);
      return true;
    } catch {
      setAudioBlocked(true);
      return false;
    }
  };

  const playTone = (frequency: number, durationMs: number, type: OscillatorType, volume = 0.03) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return;
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
  };

  const playFallbackMemeSound = (
    expression: MemeExpression,
    durationMs = FALLBACK_MEME_SOUND_MS,
    shouldLoop = true,
  ) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return;
    }

    const config: Record<
      MemeExpression,
      { frequency: number; harmonic: number; type: OscillatorType; harmonicType: OscillatorType }
    > = {
      happy: { frequency: 440, harmonic: 660, type: 'triangle', harmonicType: 'sine' },
      sad: { frequency: 196, harmonic: 294, type: 'sine', harmonicType: 'triangle' },
      surprise: { frequency: 523, harmonic: 784, type: 'square', harmonicType: 'triangle' },
    };

    const now = audioContext.currentTime;
    const endTime = now + durationMs / 1000;
    const primary = audioContext.createOscillator();
    const harmonic = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    primary.type = config[expression].type;
    primary.frequency.setValueAtTime(config[expression].frequency, now);
    harmonic.type = config[expression].harmonicType;
    harmonic.frequency.setValueAtTime(config[expression].harmonic, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.045, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    primary.connect(gainNode);
    harmonic.connect(gainNode);
    gainNode.connect(audioContext.destination);

    primary.start(now);
    harmonic.start(now);
    primary.stop(endTime);
    harmonic.stop(endTime);

    if (shouldLoop) {
      fallbackSoundTimerRef.current = window.setTimeout(() => {
        playFallbackMemeSound(expression, durationMs, shouldLoop);
      }, Math.max(500, durationMs - 120));
    }
  };

  const playSuccessChime = () => {
    playTone(520, 160, 'sine', 0.05);
    window.setTimeout(() => playTone(780, 220, 'triangle', 0.05), 120);
  };

  const playCompletionChime = () => {
    playTone(390, 220, 'triangle', 0.05);
    window.setTimeout(() => playTone(520, 260, 'sine', 0.05), 120);
    window.setTimeout(() => playTone(780, 340, 'sine', 0.05), 280);
  };

  const playMemeSceneAudio = async (scene: MemeScene, durationMs?: number) => {
    stopMemePlayback();
    const requestId = playbackRequestRef.current;
    const isAudioReady = await unlockAudio();

    if (requestId !== playbackRequestRef.current) {
      return;
    }

    if (scene.audioSrc) {
      const audio = new Audio(scene.audioSrc);
      audio.preload = 'auto';
      audio.volume = 0.72;
      audio.loop = false;
      memeAudioRef.current = audio;

      try {
        audio.onended = () => {
          if (
            durationMs !== undefined ||
            requestId !== playbackRequestRef.current ||
            completeRef.current ||
            isFree ||
            cooldownRef.current ||
            activeMemeRef.current?.expression !== scene.expression
          ) {
            return;
          }

          const nextAudioSrc = getRandomMemeAudioForExpression(scene.expression, scene.audioSrc);
          if (!nextAudioSrc) {
            playFallbackMemeSound(scene.expression);
            return;
          }

          const nextScene = { ...scene, audioSrc: nextAudioSrc };
          setActiveMeme(nextScene);
        };

        audio.onerror = () => {
          if (requestId !== playbackRequestRef.current) {
            return;
          }

          if (memeAudioRef.current === audio) {
            memeAudioRef.current = null;
          }

          const fallbackAudioSrc = getRandomMemeAudioForExpression(scene.expression, scene.audioSrc);
          if (fallbackAudioSrc) {
            void playMemeSceneAudio({ ...scene, audioSrc: fallbackAudioSrc }, durationMs);
            return;
          }

          setAudioBlocked(true);
        };

        await audio.play();
        if (requestId !== playbackRequestRef.current) {
          audio.pause();
          audio.currentTime = 0;
          return;
        }
        if (durationMs !== undefined) {
          playbackStopTimerRef.current = window.setTimeout(() => {
            if (memeAudioRef.current === audio) {
              audio.pause();
              audio.currentTime = 0;
              memeAudioRef.current = null;
            }
          }, durationMs);
        }
        setAudioBlocked(false);
        return;
      } catch {
        if (memeAudioRef.current === audio) {
          memeAudioRef.current = null;
        }
        audio.pause();
        audio.currentTime = 0;
        setAudioBlocked(true);
      }
    }

    if (isAudioReady && requestId === playbackRequestRef.current) {
      playFallbackMemeSound(scene.expression, durationMs ?? FALLBACK_MEME_SOUND_MS, durationMs === undefined);
    }
  };

  const syncMemeToExpression = (emoji: string) => {
    if (completeRef.current || isFree || !isMemeExpression(emoji)) {
      return;
    }

    if (activeMemeRef.current?.expression === emoji) {
      return;
    }

    const nextScene = getMemeSceneForExpression(emoji, activeMemeRef.current ?? undefined);
    setActiveMeme(nextScene);
  };

  const stopStreaming = () => {
    if (sendIntervalRef.current) {
      window.clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    audioContextRef.current = new AudioContextCtor();
    audioContextRef.current.resume().catch(() => undefined);

    return () => {
      stopMemePlayback();
      clearCooldownTimers();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const retryAudio = () => {
      if (!audioBlocked || !activeMemeRef.current || completeRef.current || isFree) {
        return;
      }

      void playMemeSceneAudio(activeMemeRef.current);
    };

    window.addEventListener('pointerdown', retryAudio);
    window.addEventListener('keydown', retryAudio);
    window.addEventListener('focus', retryAudio);
    document.addEventListener('visibilitychange', retryAudio);

    return () => {
      window.removeEventListener('pointerdown', retryAudio);
      window.removeEventListener('keydown', retryAudio);
      window.removeEventListener('focus', retryAudio);
      document.removeEventListener('visibilitychange', retryAudio);
    };
  }, [audioBlocked, isFree]);

  useEffect(() => {
    if (isFree || completeRef.current || cooldownRef.current) {
      return;
    }

    if (!isMemeExpression(currentTarget)) {
      return;
    }

    try {
      const scene = getMemeSceneForExpression(currentTarget, activeMemeRef.current ?? undefined);
      setActiveMeme(scene);
    } catch {
      // Keep running if local meme assets are incomplete.
    }
  }, [currentTarget, isCooldown, isFree]);

  useEffect(() => {
    if (!activeMeme || isFree || completeRef.current) {
      return;
    }

    void playMemeSceneAudio(activeMeme);

    return () => {
      stopMemePlayback();
    };
  }, [activeMeme, isCooldown, isFree]);

  const renderMemeCanvas = (
    scene: MemeScene | null,
    image: CanvasImageSource | null,
    target: EmojiName,
    detectedEmoji: string,
    finished: boolean,
    captureCount: number,
  ) => {
    const canvas = memeCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const focusExpression = scene?.expression ?? 'surprise';
    const [colorA, colorB, colorC] = getMemePalette(focusExpression);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(0.55, colorB);
    gradient.addColorStop(1, colorC);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'rgba(10, 8, 12, 0.2)';
    context.fillRect(18, 18, canvas.width - 36, canvas.height - 36);

    if (image) {
      const frameX = 28;
      const frameY = 58;
      const frameWidth = canvas.width - 56;
      const frameHeight = 170;
      context.save();
      context.beginPath();
      context.roundRect(frameX, frameY, frameWidth, frameHeight, 24);
      context.clip();
      context.drawImage(image, frameX, frameY, frameWidth, frameHeight);
      context.restore();
    } else {
      context.fillStyle = 'rgba(255, 255, 255, 0.12)';
      context.beginPath();
      context.roundRect(28, 58, canvas.width - 56, 170, 24);
      context.fill();
      context.fillStyle = '#fff8dc';
      context.font = '900 86px "Trebuchet MS", sans-serif';
      context.textAlign = 'center';
      context.fillText(getEmojiChar(focusExpression), canvas.width / 2, 170);
    }

    context.fillStyle = '#fff8ea';
    context.textAlign = 'center';
    context.font = '900 24px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif';
    context.fillText(`NOW PLAYING: ${getMemeTitle(focusExpression).toUpperCase()}`, canvas.width / 2, 38);

    context.font = '700 17px "Trebuchet MS", sans-serif';
    context.fillText(`TARGET ${getEmojiChar(target)} ${getEmojiLabel(target).toUpperCase()}`, canvas.width / 2, 256);
    context.fillText(`DETECTED ${getEmojiChar(detectedEmoji)} ${getEmojiLabel(detectedEmoji).toUpperCase()}`, canvas.width / 2, 280);

    context.textAlign = 'left';
    context.fillStyle = 'rgba(17, 17, 17, 0.76)';
    context.beginPath();
    context.roundRect(28, 238, 130, 34, 14);
    context.fill();
    context.fillStyle = '#fff8ea';
    context.font = '700 14px "Trebuchet MS", sans-serif';
    context.fillText(`Mode ${finished ? 'locked' : 'live face'}`, 40, 260);

    context.textAlign = 'right';
    context.fillStyle = 'rgba(17, 17, 17, 0.76)';
    context.beginPath();
    context.roundRect(canvas.width - 168, 238, 140, 34, 14);
    context.fill();
    context.fillStyle = '#fff8ea';
    context.fillText(`Captured ${captureCount} / ${MAX_SCORE}`, canvas.width - 40, 260);
  };

  useEffect(() => {
    let isCancelled = false;

    if (!activeMeme) {
      renderMemeCanvas(null, null, currentTarget, currentEmoji, isComplete, captures.length);
      return () => undefined;
    }

    const image = new Image();
    image.onload = () => {
      if (!isCancelled) {
        renderMemeCanvas(activeMeme, image, currentTarget, currentEmoji, isComplete, captures.length);
      }
    };
    image.onerror = () => {
      if (!isCancelled) {
        renderMemeCanvas(activeMeme, null, currentTarget, currentEmoji, isComplete, captures.length);
      }
    };
    image.src = activeMeme.imageSrc;

    return () => {
      isCancelled = true;
    };
  }, [activeMeme, captures.length, currentEmoji, currentTarget, isComplete]);

  const captureFrame = () => {
    if (!videoRef.current || !frameCanvasRef.current) {
      return null;
    }

    const context = frameCanvasRef.current.getContext('2d');
    if (!context) {
      return null;
    }

    context.drawImage(videoRef.current, 0, 0, frameCanvasRef.current.width, frameCanvasRef.current.height);
    return frameCanvasRef.current.toDataURL('image/jpeg', 0.85);
  };

  const saveCapture = async (image: string, expression: EmojiName, score: number) => {
    const response = await fetch(`${backendHttpBase}/captures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        expression,
        score,
      }),
    });

    if (!response.ok) {
      throw new Error(`Capture save failed with status ${response.status}`);
    }

    return response.json() as Promise<{ filename: string; url: string }>;
  };

  const finalizeMatch = async (matchedEmoji: EmojiName, currentWhyMeter: WhyMeter) => {
    if (savingCaptureRef.current || completeRef.current) {
      return;
    }

    savingCaptureRef.current = true;
    setStatusMessage(`Expression locked. Capturing ${getEmojiChar(matchedEmoji)} evidence...`);

    try {
      const frame = captureFrame();

      if (!frame) {
        throw new Error('Could not capture webcam frame');
      }

      const nextScore = scoreRef.current + 1;
      const saved = await saveCapture(frame, matchedEmoji, nextScore);

      setCaptures((previous) => [
        ...previous,
        {
          expression: matchedEmoji,
          emojiChar: getEmojiChar(matchedEmoji),
          imageUrl: saved.url,
          whyMeter: currentWhyMeter,
        },
      ]);
      setGameScore(nextScore);
      playSuccessChime();

      const nextTarget = getRandomTarget(matchedEmoji);
      setIsCooldown(true);
      setCooldownStep(0);
      pendingTargetRef.current = nextTarget;
      pendingCompletionRef.current = nextScore >= MAX_SCORE;
      clearCooldownTimers();

      if (isMemeExpression(matchedEmoji)) {
        const cooldownScene = getMemeSceneForExpression(matchedEmoji, activeMemeRef.current ?? undefined);
        setActiveMeme(cooldownScene);
        void playMemeSceneAudio(cooldownScene, SNAP_COOLDOWN_MS);
      } else {
        stopMemePlayback();
      }

      setStatusMessage(`Captured ${getEmojiChar(matchedEmoji)}. Cooldown 1/${SNAP_COOLDOWN_STEPS}...`);

      const stepDuration = SNAP_COOLDOWN_MS / SNAP_COOLDOWN_STEPS;
      cooldownIntervalRef.current = window.setInterval(() => {
        setCooldownStep((previous) => {
          const nextStep = Math.min(previous + 1, SNAP_COOLDOWN_STEPS);
          setStatusMessage(`Captured ${getEmojiChar(matchedEmoji)}. Cooldown ${nextStep}/${SNAP_COOLDOWN_STEPS}...`);
          return nextStep;
        });
      }, stepDuration);

      cooldownTimerRef.current = window.setTimeout(() => {
        clearCooldownTimers();
        setIsCooldown(false);
        setCooldownStep(0);

        if (pendingCompletionRef.current) {
          setStatusMessage('Judgment complete. Reviewing your performance...');
          setIsComplete(true);
          stopMemePlayback();
          stopStreaming();
          playCompletionChime();
          pendingCompletionRef.current = false;
          return;
        }

        const resumedTarget = pendingTargetRef.current ?? nextTarget;
        pendingTargetRef.current = null;
        setCurrentTarget(resumedTarget);
        setStatusMessage(`Captured. New order: match ${getEmojiChar(resumedTarget)}.`);
      }, SNAP_COOLDOWN_MS);
    } catch (captureError) {
      const message = captureError instanceof Error ? captureError.message : 'Unknown capture error';
      setError(`Snapshot workflow failed: ${message}`);
      setStatusMessage('Capture failed. Match the face again to retry.');
    } finally {
      savingCaptureRef.current = false;
    }
  };

  useEffect(() => {
    const socket = new WebSocket(`${backendWsBase}/ws`);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { emoji?: string; why_meter?: WhyMeter };
        const nextWhyMeter = payload.why_meter ?? DEFAULT_METER;
        const nextEmoji = payload.emoji ?? 'none';

        setWhyMeter(nextWhyMeter);
        setCurrentEmoji(nextEmoji);
        syncMemeToExpression(nextEmoji);

        if (completeRef.current || savingCaptureRef.current || isFree || cooldownRef.current) {
          return;
        }

        if (nextEmoji === targetRef.current) {
          setStatusMessage(`Match confirmed for ${getEmojiChar(targetRef.current)}.`);
          void finalizeMatch(targetRef.current, nextWhyMeter);
        } else {
          setStatusMessage(`Match target ${getEmojiChar(targetRef.current)}.`);
        }
      } catch {
        // Ignore malformed socket payloads.
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [isFree]);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        if (isFree) {
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        sendIntervalRef.current = window.setInterval(() => {
          if (
            completeRef.current ||
            !videoRef.current ||
            !frameCanvasRef.current ||
            wsRef.current?.readyState !== WebSocket.OPEN
          ) {
            return;
          }

          const context = frameCanvasRef.current.getContext('2d');
          if (!context) {
            return;
          }

          context.drawImage(videoRef.current, 0, 0, frameCanvasRef.current.width, frameCanvasRef.current.height);
          const dataUrl = frameCanvasRef.current.toDataURL('image/jpeg', 0.5);
          wsRef.current.send(dataUrl);
        }, 80);
      } catch (webcamError) {
        const message = webcamError instanceof Error ? webcamError.message : 'Unknown webcam error';
        setError(`Failed to access webcam: ${message}`);
      }
    };

    void startWebcam();

    return () => {
      stopStreaming();
    };
  }, [isFree]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !completeRef.current && !isFree) {
        setIsTrapped(true);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const blockedFullscreenExit =
        event.key === 'Escape' ||
        event.key === 'F11' ||
        ((event.ctrlKey || event.metaKey) && ['w', 'W', 'r', 'R'].includes(event.key));

      if (blockedFullscreenExit && !completeRef.current && !isFree) {
        event.preventDefault();
        setIsTrapped(true);
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!completeRef.current && !isFree) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFree]);

  const handleReturnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsTrapped(false);
      await ensureAudioContextReady();
      if (activeMemeRef.current) {
        void playMemeSceneAudio(activeMemeRef.current);
      }
    } catch {
      setError('Could not restore fullscreen mode.');
    }
  };

  const handleQuit = async () => {
    stopMemePlayback();
    clearCooldownTimers();

    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => undefined);
    }

    setIsFree(true);
  };

  const averageWhyScore = captures.length
    ? Math.round(captures.reduce((total, capture) => total + capture.whyMeter.why_score, 0) / captures.length)
    : Math.round(whyMeter.why_score);

  const averageBoredom = captures.length
    ? Math.round(captures.reduce((total, capture) => total + capture.whyMeter.boredom, 0) / captures.length)
    : Math.round(whyMeter.boredom);

  const averageConfusion = captures.length
    ? Math.round(captures.reduce((total, capture) => total + capture.whyMeter.confusion, 0) / captures.length)
    : Math.round(whyMeter.confusion);

  const averageDread = captures.length
    ? Math.round(captures.reduce((total, capture) => total + capture.whyMeter.dread, 0) / captures.length)
    : Math.round(whyMeter.dread);

  const liveMetrics = [
    { label: 'Boredom', value: `${Math.round(whyMeter.boredom)}%` },
    { label: 'Confusion', value: `${Math.round(whyMeter.confusion)}%` },
    { label: 'Existential Dread', value: `${Math.round(whyMeter.dread)}%` },
    { label: 'Detected Face', value: `${getEmojiChar(currentEmoji)} ${getEmojiLabel(currentEmoji)}` },
    { label: 'Meme Cycle', value: activeMeme ? getMemeTitle(activeMeme.expression) : 'Loading…' },
    { label: 'Flow', value: isCooldown ? `${cooldownStep}/${SNAP_COOLDOWN_STEPS}` : 'Live' },
    {
      label: 'Meme Audio',
      value: audioBlocked ? 'Recovering in background' : activeMeme?.audioSrc ? 'Custom file' : 'Fallback synth',
    },
  ];

  if (isFree) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <h1>YOU ARE FREE.</h1>
          <p>The simulation has ended. Your captured evidence remains on the server.</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="results-screen">
        <div className="results-panel">
          <h2>Final Judgment</h2>
          <p className="results-summary">
            Five captures survived inspection. Average Why score: {averageWhyScore}%.
          </p>

          <div className="metrics-grid">
            <div className="metric-card">
              <span>Why</span>
              <strong>{averageWhyScore}%</strong>
            </div>
            <div className="metric-card">
              <span>Boredom</span>
              <strong>{averageBoredom}%</strong>
            </div>
            <div className="metric-card">
              <span>Confusion</span>
              <strong>{averageConfusion}%</strong>
            </div>
            <div className="metric-card">
              <span>Dread</span>
              <strong>{averageDread}%</strong>
            </div>
            <div className="metric-card">
              <span>Last Face</span>
              <strong>{getEmojiChar(currentEmoji)} {getEmojiLabel(currentEmoji)}</strong>
            </div>
          </div>

          <div className="capture-grid">
            {captures.map((capture, index) => (
              <article className="capture-card" key={`${capture.expression}-${index}`}>
                <img src={capture.imageUrl} alt={`${capture.expression} capture ${index + 1}`} />
                <div className="capture-card-body">
                  <h3>
                    {capture.emojiChar} {capture.expression}
                  </h3>
                  <p>Why {Math.round(capture.whyMeter.why_score)}%</p>
                  <p>B {Math.round(capture.whyMeter.boredom)} / C {Math.round(capture.whyMeter.confusion)} / D {Math.round(capture.whyMeter.dread)}</p>
                </div>
              </article>
            ))}
          </div>

          <button className="quit-btn" onClick={() => void handleQuit()}>
            EXIT SIMULATION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="webcam-shell">
      {error ? (
        <p className="error">{error}</p>
      ) : null}

      <div className="overlay-container">
        <div className="video-stage">
          <div className="stage-summary">
            <div className="summary-pill">
              <span>Step</span>
              <strong>{gameScore + 1} / {MAX_SCORE}</strong>
            </div>
            <div className="summary-pill">
              <span>Target</span>
              <strong>{getEmojiChar(currentTarget)} {getEmojiLabel(currentTarget)}</strong>
            </div>
            <div className="summary-pill">
              <span>Why</span>
              <strong>{Math.round(whyMeter.why_score)}%</strong>
            </div>
          </div>
          <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
          <div className="status-banner">{statusMessage}</div>
          <div className="why-meter-container">
            <div
              className="why-meter-fill"
              style={{ width: `${isCooldown ? (cooldownStep / SNAP_COOLDOWN_STEPS) * 100 : whyMeter.why_score}%` }}
            />
          </div>
        </div>

        <div className="side-panel">
          <section className="panel-section">
            <div className="panel-heading">
              <h3>Live Analysis</h3>
              <p>Three live expressions, five captures, cleaner signals.</p>
            </div>
            <div className="live-metrics-grid">
              {liveMetrics.map((metric) => (
                <article className="live-metric-card" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <div className="panel-heading">
              <h3>Meme Board</h3>
              <p>The board snaps to the detected face so the meme image and sound stay on the same reaction.</p>
            </div>
            <canvas ref={memeCanvasRef} width={420} height={300} className="meme-canvas" />
          </section>

          <section className="panel-section">
            <div className="panel-heading">
              <h3>Approved Photos</h3>
              <p>Captured matches from each completed step.</p>
            </div>
            <div className="capture-strip">
              {captures.length === 0 ? (
                <p>No approved face captures yet.</p>
              ) : (
                captures.map((capture, index) => (
                  <figure key={`${capture.expression}-${index}`} className="capture-tile">
                    <img
                      className="capture-thumb"
                      src={capture.imageUrl}
                      alt={`${capture.expression} thumbnail ${index + 1}`}
                    />
                    <figcaption>{capture.emojiChar} {getEmojiLabel(capture.expression)}</figcaption>
                  </figure>
                ))
              )}
            </div>
          </section>
        </div>

        <canvas ref={frameCanvasRef} width={320} height={240} style={{ display: 'none' }} />

        {isTrapped ? (
          <div className="trap-warning">
            <h1>DO NOT ESCAPE</h1>
            <p>The judge requires fullscreen compliance.</p>
            <button className="enter-btn" onClick={() => void handleReturnToFullscreen()}>
              RETURN TO FULLSCREEN
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WebcamCapture;
