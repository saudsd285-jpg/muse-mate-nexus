import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Rocket, Star, Hash, MessageSquare, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StarsBackground from "@/components/chat/StarsBackground";
import { loadRatings } from "@/lib/api";

const FRIEND_CODES: Record<string, { name: string; message: string }> = {
  "772": { name: "صديق المؤسس", message: "يا حبي لك! أهلاً صديق المؤسس 🌟 أنت غالي علينا" },
  "5515": { name: "محمد فهد الحساني", message: "أهلاً يا محمد فهد الحساني! يا مرحبا بصديقنا العزيز 🤝" },
  "15": { name: "مثنى الشريف", message: "يا هلا يا مثنى الشريف! منور يا غالي ✨" },
  "70": { name: "عبدالله القرشي", message: "أهلاً يا عبدالله القرشي! حياك الله 🌙" },
  "18": { name: "محمد السواط", message: "مرحبا يا محمد السواط! نورت يا بطل 💫" },
  "44": { name: "بدر سعود القثامي", message: "يا هلا يا بدر سعود القثامي! البارود لهذيل يخسون القثمان 🔥" },
  "101": { name: "عيال عمي", message: "يا هلا بعيال العم بتولي وحمودي! حياكم 👋" },
  "1888": { name: "جيزاني", message: "أهلاً يا جيزاني! كيفك يا غالي 🌴" },
};

const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadRatings().then(setRatings);
  }, []);

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : "5.0";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: username.trim(), display_name: username.trim() } },
      });
      if (error) throw error;
      const code = friendCode.trim();
      if (code && FRIEND_CODES[code]) {
        setTimeout(() => {
          toast({ title: `🌟 مرحباً ${FRIEND_CODES[code].name}!`, description: FRIEND_CODES[code].message });
        }, 1000);
      }
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="fixed inset-0 bg-gradient-to-b from-[hsl(230,25%,5%)] via-[hsl(230,30%,8%)] to-[hsl(220,40%,12%)]" />
      <StarsBackground />

      <motion.div
        className="fixed w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
        style={{ background: "radial-gradient(circle, hsl(217,91%,60%), transparent)", top: "10%", right: "-10%" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
        style={{ background: "radial-gradient(circle, hsl(199,89%,48%), transparent)", bottom: "5%", left: "-5%" }}
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[hsl(217,91%,60%)] via-[hsl(199,89%,48%)] to-[hsl(230,50%,40%)] flex items-center justify-center shadow-2xl shadow-[hsl(217,91%,60%)]/30 relative overflow-hidden"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
              animate={{ x: [-120, 120] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            />
            <Rocket className="w-10 h-10 text-white" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[hsl(217,91%,65%)] to-[hsl(199,89%,55%)] bg-clip-text text-transparent">UXIN</span>
              <span className="text-white mr-2"> AI</span>
            </h1>
            <p className="text-[hsl(215,20%,55%)] text-sm mt-2 flex items-center justify-center gap-1">
              <Star className="w-3 h-3" /> مساعدك الذكي في عالم الفضاء <Star className="w-3 h-3" />
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: <Star className="w-4 h-4 text-amber-400" />, value: avgRating, label: "تقييم" },
            { icon: <Users className="w-4 h-4 text-[hsl(199,89%,55%)]" />, value: `${ratings.length}+`, label: "مستخدم" },
            { icon: <Sparkles className="w-4 h-4 text-purple-400" />, value: "∞", label: "إمكانية" },
          ].map((stat, i) => (
            <div key={i} className="bg-[hsl(230,25%,10%)]/60 backdrop-blur-sm border border-[hsl(217,91%,60%)]/10 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <div className="text-white font-bold text-lg">{stat.value}</div>
              <div className="text-[hsl(215,20%,50%)] text-[10px]">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-[hsl(230,25%,10%)]/80 backdrop-blur-xl border border-[hsl(217,91%,60%)]/20 rounded-2xl p-6 space-y-4 shadow-2xl shadow-[hsl(217,91%,60%)]/10"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,20%,55%)]" />
              <input
                type="text" placeholder="اكتب اسمك هنا..." value={username}
                onChange={(e) => setUsername(e.target.value)} required
                className="w-full pr-10 pl-4 py-3.5 rounded-xl bg-[hsl(230,20%,14%)]/80 border border-[hsl(217,91%,60%)]/20 text-white placeholder:text-[hsl(215,20%,45%)] text-sm outline-none focus:ring-2 focus:ring-[hsl(217,91%,60%)]/40 transition-all"
              />
            </div>
            <div className="relative">
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,20%,55%)]" />
              <input
                type="text" placeholder="كود صديق (اختياري)" value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                className="w-full pr-10 pl-4 py-3.5 rounded-xl bg-[hsl(230,20%,14%)]/80 border border-[hsl(217,91%,60%)]/20 text-white placeholder:text-[hsl(215,20%,45%)] text-sm outline-none focus:ring-2 focus:ring-[hsl(217,91%,60%)]/40 transition-all"
              />
            </div>
            <motion.button type="submit" disabled={loading || !username.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[hsl(217,91%,55%)] to-[hsl(199,89%,45%)] text-white font-medium text-sm hover:shadow-lg hover:shadow-[hsl(217,91%,60%)]/30 transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : (<><Rocket className="w-4 h-4" /><span>انطلق!</span></>)}
            </motion.button>
          </form>
        </motion.div>

        {/* Ratings section */}
        {ratings.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-2 text-[hsl(215,20%,55%)] text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>آراء المستخدمين</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin px-1">
              {ratings.slice(0, 5).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="bg-[hsl(230,25%,10%)]/60 backdrop-blur-sm border border-[hsl(217,91%,60%)]/10 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-medium">{r.display_name || "مجهول"}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className={`w-3 h-3 ${s < r.rating ? "text-amber-400 fill-amber-400" : "text-[hsl(215,20%,30%)]"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-[hsl(215,20%,55%)] text-[11px] leading-relaxed">{r.comment}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-xs text-[hsl(215,20%,45%)]">
          ادخل اسمك وابدأ رحلتك مع UXIN AI 🚀
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
