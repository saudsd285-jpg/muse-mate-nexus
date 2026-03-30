import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { streamChat } from "@/lib/api";
import { getDialect, getEmotion } from "@/components/chat/SettingsDialog";

interface VoiceCallDialogProps {
  open: boolean;
  onClose: () => void;
  onMessageReceived?: (userText: string, aiText: string) => void;
}

const WaveformVisualizer = ({ active, color = "primary" }: { active: boolean; color?: string }) => {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[2px] h-16">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color === "primary" ? "bg-primary" : "bg-primary/60"}`}
          animate={active ? {
            height: [8, Math.random() * 50 + 10, 8, Math.random() * 40 + 15, 8],
          } : { height: 8 }}
          transition={{
            duration: active ? 0.8 + Math.random() * 0.4 : 0.3,
            repeat: active ? Infinity : 0,
            delay: i * 0.03,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const VoiceCallDialog = ({ open, onClose, onMessageReceived }: VoiceCallDialogProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [statusText, setStatusText] = useState("جاري الاتصال...");
  const [isConnected, setIsConnected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  // Start call
  useEffect(() => {
    if (!open) return;
    setCallDuration(0);
    setIsConnected(false);
    setStatusText("جاري الاتصال...");
    conversationRef.current = [];

    const timer = setTimeout(() => {
      setIsConnected(true);
      setStatusText("متصل - تحدث الآن");
      startListening();
    }, 1500);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [open]);

  // Duration counter
  useEffect(() => {
    if (isConnected) {
      intervalRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isConnected]);

  const cleanup = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    abortRef.current?.abort();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setIsConnected(false);
  };

  const startListening = useCallback(() => {
    if (isMuted) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatusText("أتكلم... 🎙️");
    };

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      if (!text.trim()) { startListening(); return; }
      setIsListening(false);
      setStatusText("جاري التفكير...");
      setIsProcessing(true);
      await processUserSpeech(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (isConnected && !isMuted) setTimeout(startListening, 500);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isMuted, isConnected]);

  const processUserSpeech = async (userText: string) => {
    conversationRef.current.push({ role: "user", content: userText });

    let aiResponse = "";
    const controller = new AbortController();
    abortRef.current = controller;

    await streamChat({
      messages: conversationRef.current,
      onDelta: (chunk) => { aiResponse += chunk; },
      onDone: async () => {
        setIsProcessing(false);
        if (aiResponse) {
          conversationRef.current.push({ role: "assistant", content: aiResponse });
          onMessageReceived?.(userText, aiResponse);
          speakText(aiResponse);
        }
      },
      onError: () => {
        setIsProcessing(false);
        setStatusText("خطأ - حاول مرة أخرى");
        setTimeout(startListening, 1500);
      },
      signal: controller.signal,
      dialect: getDialect(),
      emotion: getEmotion(),
    });
  };

  const speakText = (text: string) => {
    // Clean markdown
    const clean = text.replace(/[#*_`>\-\[\]()!]/g, "").replace(/\n+/g, ". ").trim();
    
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "ar-SA";
    utterance.rate = 1;
    utterance.pitch = 1;

    // Try to find Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText("يتكلم... 🔊");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusText("متصل - تحدث الآن");
      if (!isMuted && isConnected) startListening();
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Interrupt: when user starts speaking, stop AI
  useEffect(() => {
    if (isListening && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isListening, isSpeaking]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatusText("المايك مغلق");
    } else {
      setStatusText("متصل - تحدث الآن");
      if (isConnected && !isSpeaking) startListening();
    }
  };

  const endCall = () => {
    cleanup();
    onClose();
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="flex flex-col items-center gap-6 p-8 max-w-sm w-full"
        >
          {/* Avatar with waveform ring */}
          <div className="relative">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30"
              animate={isSpeaking || isListening ? { 
                boxShadow: [
                  "0 0 30px hsl(var(--primary) / 0.3)",
                  "0 0 60px hsl(var(--primary) / 0.5)",
                  "0 0 30px hsl(var(--primary) / 0.3)"
                ]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg width="50" height="50" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L8 12V28L20 36L32 28V12L20 4Z" stroke="white" strokeWidth="2" fill="none" />
                <path d="M20 10L14 14V26L20 30L26 26V14L20 10Z" fill="white" fillOpacity="0.9" />
                <circle cx="20" cy="20" r="4" fill="white" />
              </svg>
            </motion.div>

            {/* Pulse rings */}
            {(isSpeaking || isListening) && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </div>

          {/* Name & Status */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold">
              <span className="text-primary">UXIN</span> AI
            </h2>
            <p className="text-sm text-muted-foreground">{statusText}</p>
            {isConnected && (
              <p className="text-xs text-muted-foreground font-mono">{formatDuration(callDuration)}</p>
            )}
          </div>

          {/* Waveform */}
          <WaveformVisualizer active={isSpeaking || isListening} color={isSpeaking ? "primary" : "primary"} />

          {/* Controls */}
          <div className="flex items-center gap-6 mt-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg shadow-destructive/30"
            >
              <PhoneOff className="w-7 h-7" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-full bg-secondary text-foreground flex items-center justify-center"
            >
              <Volume2 className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceCallDialog;
