import { Bot, Code, Image, Search } from "lucide-react";

const features = [
  { icon: Bot, label: "محادثة ذكية", desc: "رد سريع وذكي" },
  { icon: Code, label: "كتابة كود", desc: "بكل اللغات" },
  { icon: Image, label: "إنشاء صور", desc: "من النص" },
  { icon: Search, label: "بحث متقدم", desc: "عبر الإنترنت" },
];

const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            <span className="text-primary">UXIN</span> AI
          </h2>
          <p className="text-muted-foreground text-sm mt-1">مساعدك الذكي — اسأل أي شيء!</p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-secondary/50 border border-border"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
