import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';

// --- Type Definition ---
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// --- Utility Function for Countdown Logic ---
const calculateTimeLeft = (targetDate: number): TimeLeft => {
  const now = new Date().getTime();
  const distance = targetDate - now;

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
};

export default function StockBudLanding(): JSX.Element {
  // --- State Hooks ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [targetDate, setTargetDate] = useState<number | null>(null);

  useEffect(() => {
const fetchTimer = async () => {
  try {
    const response = await fetch('/api/timer');
    const data = await response.json();
    setTargetDate(new Date().getTime() + data.timer * 1000);
  } catch (error) {
    setTargetDate(new Date("2026-01-01T00:00:00Z").getTime());
  }
};

const handleSubmit = useCallback(async (e: React.FormEvent) => {
  // ... validation
  try {
    const response = await fetch('/api/signup', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    // ... handle response
  } catch {
    setSubmissionStatus("error");
    setStatusMessage("Network error. Please try again later.");
  }
}, [name, email]);

    fetchTimer();
  }, []);

  // --- Countdown Effect ---
  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // --- Form Submission Handler (useCallback for better memoization) ---
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatusMessage("Please enter a valid email address.");
      setSubmissionStatus("error");
      return;
    }

    setSubmissionStatus("loading");
    setStatusMessage("Joining waitlist...");

    try {
      const url = import.meta.env.VITE_API_URL;
      const response = await fetch(`${url}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();
      if (response.ok) {
        setSubmissionStatus("success");
        setStatusMessage("You're on the waitlist! We'll be in touch. 🎉");
        setName("");
        setEmail("");
      } else {
        setSubmissionStatus("error");
        setStatusMessage(data.message || "Oops! Something went wrong on the server.");
      }
    } catch {
      setSubmissionStatus("error");
      setStatusMessage("Network error. Please try again later.");
    }
  }, [name, email]);

  // --- Render Helpers (for cleaner JSX) ---
  const countdownItems = useMemo(() => [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds }
  ], [timeLeft]);

  const featureList = [
    {
      icon: "⚡️",
      title: "Real-Time Sync",
      desc: "Instantaneous, accurate stock counts synced directly with your  store. No more delays or manual refreshes.",
    },
    {
      icon: "🧠",
      title: "Predictive AI Forecasting",
      desc: "Stop guessing. Our AI predicts optimal restock points to eliminate costly stockouts and overstocking.",
    },
    {
      icon: "🔗",
      title: "Zero-Friction Integration",
      desc: "Install in minutes, not hours. A beautiful, intuitive dashboard built for All merchants.",
    },
  ];

  const testimonial = {
      quote: "StockBud is the future of commerce everywhere",
      author: "Uche Stephen"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 relative overflow-hidden font-sans">
      {/* Background elements with new color scheme */}
      <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-indigo-500/10 rounded-full blur-[150px] animate-slow-pulse opacity-50" />
      <div className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 bg-purple-400/10 rounded-full blur-[180px] animate-slow-bounce opacity-40" />

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center px-6 py-6 md:px-16 border-b border-gray-200/50">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transform hover:scale-[1.02] transition-transform duration-300">
          StockBud
        </h1>
        <span className="text-sm text-indigo-600/80 font-medium border border-indigo-400/30 px-3 py-1 rounded-full backdrop-blur-sm bg-white/50">
          Launching 2026 🚀
        </span>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 py-24 space-y-8 md:py-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2 animate-fadeIn delay-100">
            The AI-Powered Inventory System
        </p>
        <h2 className="text-5xl sm:text-7xl font-extrabold leading-snug max-w-4xl bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent animate-fadeIn delay-200">
          Never Miss a Sale. Never Overstock.
        </h2>
        <p className="max-w-3xl text-xl text-gray-700 animate-fadeIn delay-300">
          **StockBud** is the smarter way to manage inventory offline and online, giving you real-time tracking, predictive restocking, and AI-powered insights to maximize profit.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mt-12 p-2 bg-white/70 rounded-2xl border border-gray-200/50 backdrop-blur-sm animate-slideUp delay-400">
            <input
                type="text"
                placeholder="Your Name (e.g., Alex)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex-1 px-5 py-4 rounded-xl bg-white/80 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 focus:outline-none border border-gray-300 transition duration-300"
                disabled={submissionStatus === "loading"}
            />
            <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-4 rounded-xl bg-white/80 placeholder-gray-500 focus:ring-2 focus:ring-indigo-400 focus:outline-none border border-gray-300 transition duration-300"
                disabled={submissionStatus === "loading"}
            />
            <button
                type="submit"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-400/50 hover:bg-gradient-to-l transition duration-300 transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center"
                disabled={submissionStatus === "loading"}
            >
                {submissionStatus === "loading" ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    'Secure Your Spot'
                )}
            </button>
        </form>
        {statusMessage && (
            <p className={`text-sm mt-4 font-medium ${submissionStatus === "error" ? "text-red-600" : "text-indigo-600"}`}>
                {statusMessage}
            </p>
        )}

        {/* Testimonial / Social Proof */}
        <div className="mt-12 max-w-2xl p-4 border-l-4 border-indigo-500 bg-white/50 rounded-r-lg shadow-xl animate-fadeIn delay-500">
            <p className="italic text-gray-700">
                "{testimonial.quote}"
            </p>
            <p className="text-sm font-semibold text-indigo-600 mt-2">— {testimonial.author}</p>
        </div>

      </section>

      {/* --- Horizontal Rule Separator --- */}
      <hr className="w-4/5 mx-auto border-gray-300" />

      {/* Countdown Timer */}
      <section className="relative z-10 text-center px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600 mb-6">
            LAUNCHING SOON
        </p>
        <div className="grid grid-cols-4 gap-6 max-w-xl mx-auto">
          {countdownItems.map((item, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/70 border border-gray-300 backdrop-blur-sm text-center shadow-2xl transition duration-500 hover:border-indigo-500/50">
              <p className="text-4xl md:text-5xl font-extrabold text-indigo-600 tabular-nums">
                  {String(item.value).padStart(2, '0')}
              </p>
              <span className="text-xs text-gray-600 uppercase tracking-widest mt-1 block">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- Horizontal Rule Separator --- */}
      <hr className="w-4/5 mx-auto border-gray-300" />

      {/* Features */}
      <section className="relative z-10 px-6 py-20 md:px-16">
          <h3 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Transform Your Inventory Workflow
          </h3>
        <div className="grid md:grid-cols-3 gap-12 text-center max-w-6xl mx-auto">
          {featureList.map((f, i) => (
            <div key={i} className="p-10 rounded-3xl bg-white/70 border border-gray-300 backdrop-blur-sm hover:border-indigo-500 transition duration-500 shadow-xl hover:shadow-indigo-900/30">
                <span className="text-4xl block mb-4">{f.icon}</span>
              <h4 className="text-2xl font-semibold text-indigo-700 mb-3">{f.title}</h4>
              <p className="text-gray-600 text-base">{f.desc}</p>
            </div>
          ))}
        </div>
        {/* Secondary CTA */}
        <div className="text-center mt-20">
            <a href="#hero-form" className="inline-block px-10 py-4 rounded-xl text-lg bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-white shadow-2xl shadow-indigo-500/40 hover:scale-105 transition duration-300 transform">
                Ready to Stop Guessing? Join the Waitlist Today!
            </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-gray-600 text-sm border-t border-gray-300 mt-10">
        © {new Date().getFullYear()} StockBud. Built for commerce everywhere.
      </footer>

      {/* Enhanced Styles */}
      <style jsx>{`
        @keyframes fadeIn { from {opacity: 0; transform: translateY(30px);} to {opacity: 1; transform: translateY(0);} }
        @keyframes slideUp { from {opacity: 0; transform: translateY(50px);} to {opacity: 1; transform: translateY(0);} }
        @keyframes slow-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes slow-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }

        .animate-fadeIn { animation: fadeIn 1s ease forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .animate-slideUp { animation: slideUp 1.2s ease forwards; opacity: 0; }
        .animate-slow-pulse { animation: slow-pulse 10s infinite ease-in-out; }
        .animate-slow-bounce { animation: slow-bounce 15s infinite ease-in-out; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}