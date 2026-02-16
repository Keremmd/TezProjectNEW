import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from "../lib/utils";
import { BGPattern } from "../components/ui/bg-pattern";
import {
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  FileText,
  Sparkles,
  Upload,
  Users,
  Brain,
  MessageSquare,
  Zap,
  Shield,
  TrendingUp,
  Star,
  Quote,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

// Logo Component
const Logo = ({ className }) => {
  return (
    <span className={cn("text-2xl font-bold text-gray-900 dark:text-white", className)}>
      StudyPDF
    </span>
  );
};

// Animated Group Component
function AnimatedGroup({ children, className, variants }) {
  const defaultVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  };

  const finalVariants = variants || defaultVariants;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={finalVariants.container}
      className={className}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={finalVariants.item}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={finalVariants.item}>{children}</motion.div>
      )}
    </motion.div>
  );
}

// Header Component
const HeroHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Sync theme to DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { name: "How it Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.offsetTop - 80; // 80px for header height
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-20 w-full px-2 group">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-white/90 dark:bg-black/90 max-w-4xl rounded-2xl border border-gray-200 dark:border-zinc-800 backdrop-blur-lg lg:px-5 shadow-lg"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <a href="/" aria-label="home" className="flex items-center space-x-2">
                <Logo />
              </a>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block duration-150 cursor-pointer"
                    >
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-0 lg:bg-transparent dark:lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        onClick={(e) => { handleNavClick(e, item.href); setMenuState(false); }}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block duration-150 cursor-pointer"
                      >
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit items-center">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-gray-300 dark:border-zinc-700 !bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  style={{ backgroundColor: 'transparent !important' }}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {user ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-white text-black hover:bg-gray-100 transition-all",
                        isScrolled && "lg:inline-flex"
                      )}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={async () => {
                        await signOut();
                        navigate('/');
                      }}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent dark:bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-500 dark:hover:text-red-400 transition-all flex items-center justify-center gap-2",
                        isScrolled && "lg:inline-flex"
                      )}
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-zinc-700 !bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors",
                        isScrolled && "lg:inline-flex"
                      )}
                      style={{ backgroundColor: 'transparent !important' }}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-white text-black hover:bg-gray-100 transition-all",
                        isScrolled ? "lg:inline-flex" : "lg:inline-flex"
                      )}
                    >
                      {isScrolled ? "Get Started Free" : "Sign Up"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

// Card Components
const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      "rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

// Main Landing Page Component
function LandingPageNew() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const transitionVariants = {
    item: {
      hidden: {
        opacity: 0,
        filter: "blur(12px)",
        y: 12,
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
          type: "spring",
          bounce: 0.3,
          duration: 1.5,
        },
      },
    },
  };

  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden relative">

        {/* Hero Section */}
        <section className="relative z-10 bg-transparent">
          <div className="relative pt-24 md:pt-32 pb-20">
            <div className="mx-auto max-w-7xl px-6">
              {/* Title and Description */}
              <AnimatedGroup variants={transitionVariants}>
                <div className="text-center mb-16">
                  <h1 className="max-w-4xl mx-auto text-balance text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                    Transform Your Learning with AI-Powered PDFs
                  </h1>
                  <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-gray-600 dark:text-gray-400">
                    Upload any PDF and let our AI create summaries, generate quizzes, and
                    enable collaborative learning. The future of education is here.
                  </p>
                </div>
              </AnimatedGroup>

              {/* Upload Section with Buttons */}
              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.4,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
              >
                <div className="max-w-4xl mx-auto">
                  {/* Upload Card */}
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 md:p-12 shadow-2xl">
                    {/* Upload Area */}
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500/50 transition-all duration-300 p-12 text-center group cursor-pointer">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Your PDF</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Drag and drop or <span className="text-blue-500 dark:text-blue-400 font-medium">click to browse</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Supports PDF files up to 50MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Divider with OR */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-zinc-900 text-gray-500 font-medium">
                          Or get started
                        </span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={() => navigate('/register')}
                        className="w-full sm:w-auto group relative overflow-hidden px-8 py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                      >
                        <span className="flex items-center justify-center gap-2">
                          Start Learning Free
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600 transition-all"
                      >
                        Watch Demo
                      </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Free forever plan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>10K+ active students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>

        {/* How It Works Section - Redesigned */}
        <section id="how-it-works" className="bg-transparent relative z-10 py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Transform your PDFs into learning materials in seconds
              </p>
            </motion.div>

            <div className="max-w-5xl mx-auto">
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Upload Your PDF",
                    description: "Drag and drop any academic PDF or browse to upload. We support files up to 50MB and multiple formats.",
                    icon: Upload,
                    gradient: "from-blue-500 to-cyan-500",
                    detail: "Instant processing • Secure upload • Multiple files"
                  },
                  {
                    step: "2",
                    title: "AI Magic Happens",
                    description: "Our advanced GPT-4 powered AI analyzes your document, extracts key concepts, and generates comprehensive summaries.",
                    icon: Brain,
                    gradient: "from-purple-500 to-pink-500",
                    detail: "Smart analysis • Key concepts • Formulas extraction"
                  },
                  {
                    step: "3",
                    title: "Learn & Master",
                    description: "Access AI-generated summaries, take personalized quizzes, and collaborate with peers to enhance your learning.",
                    icon: Sparkles,
                    gradient: "from-green-500 to-emerald-500",
                    detail: "Auto quizzes • Social sharing • Progress tracking"
                  }
                ].map((step, index) => {
                  const StepIcon = step.icon;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.7, 
                        delay: index * 0.15,
                        type: "spring",
                        stiffness: 80
                      }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      <div className="flex flex-col md:flex-row items-center gap-6 group">
                        {/* Left Side - Icon & Number */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="relative flex-shrink-0"
                        >
                          {/* Main Circle */}
                          <div className={cn(
                            "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center relative z-10 shadow-xl",
                            step.gradient
                          )}>
                            <StepIcon className="w-10 h-10 text-white" />
                          </div>
                          
                          {/* Step Number */}
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm z-20 shadow-lg">
                            {step.step}
                          </div>

                          {/* Animated Glow */}
                          <motion.div 
                            className={cn(
                              "absolute inset-0 rounded-2xl blur-xl opacity-40",
                              step.gradient.includes("blue") && "bg-blue-500",
                              step.gradient.includes("purple") && "bg-purple-500",
                              step.gradient.includes("green") && "bg-green-500"
                            )}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.4, 0.6, 0.4],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.div>

                        {/* Right Side - Content Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="flex-1 w-full"
                        >
                          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
                            {/* Gradient Overlay */}
                            <div className={cn(
                              "absolute top-0 right-0 w-64 h-64 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                              step.gradient.includes("blue") && "bg-blue-500",
                              step.gradient.includes("purple") && "bg-purple-500",
                              step.gradient.includes("green") && "bg-green-500"
                            )} />

                            <div className="relative z-10">
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-base mb-4 leading-relaxed">
                                {step.description}
                              </p>
                              
                              {/* Features Tags */}
                              <div className="flex flex-wrap gap-2">
                                {step.detail.split(' • ').map((feature, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.15 + i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-xs rounded-full border border-gray-200 dark:border-zinc-700"
                                  >
                                    {feature}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>

                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-transparent relative z-10 py-12 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Powerful AI Features
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Everything you need to supercharge your learning experience
              </p>
            </div>

            <div className="mx-auto grid gap-2 sm:grid-cols-5">
              {/* PDF Summarization - Large Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true }}
                className="sm:col-span-3"
              >
                <Card className="h-full group overflow-hidden shadow-black/5 sm:rounded-none sm:rounded-tl-xl hover:border-blue-500/50 transition-all duration-300">
                  <CardHeader>
                    <div className="md:p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="bg-blue-500/10 p-2 rounded-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <FileText className="w-5 h-5 text-blue-500" />
                        </motion.div>
                        <p className="font-medium text-lg">PDF Summarization</p>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-sm text-sm">
                        Our AI instantly analyzes and summarizes lengthy PDFs into
                        digestible key points, saving you hours of reading time.
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="relative h-fit px-6 pb-6 md:px-12 md:pb-12">
                    <motion.div 
                      className="bg-gray-100 dark:bg-zinc-950 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="space-y-3 mb-6">
                        <motion.div 
                          className="h-3 bg-blue-500/50 rounded w-3/4"
                          animate={{ width: ["0%", "75%"] }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                        <motion.div 
                          className="h-3 bg-blue-500/50 rounded w-full"
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ duration: 1, delay: 0.7 }}
                        />
                        <motion.div 
                          className="h-3 bg-blue-500/50 rounded w-5/6"
                          animate={{ width: ["0%", "83.333333%"] }}
                          transition={{ duration: 1, delay: 0.9 }}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-800">
                        <span className="text-xs text-gray-500">Processing time: ~2 seconds</span>
                        <span className="text-xs text-blue-400 font-medium">95% accuracy</span>
                      </div>
                    </motion.div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <motion.div 
                        className="text-center p-3 bg-gray-100 dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800"
                        whileHover={{ y: -2 }}
                      >
                        <div className="text-2xl font-bold text-blue-500 dark:text-blue-400 mb-1">50K+</div>
                        <div className="text-xs text-gray-500">PDFs Processed</div>
                      </motion.div>
                      <motion.div 
                        className="text-center p-3 bg-gray-100 dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800"
                        whileHover={{ y: -2 }}
                      >
                        <div className="text-2xl font-bold text-blue-500 dark:text-blue-400 mb-1">10+</div>
                        <div className="text-xs text-gray-500">Languages</div>
                      </motion.div>
                      <motion.div 
                        className="text-center p-3 bg-gray-100 dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800"
                        whileHover={{ y: -2 }}
                      >
                        <div className="text-2xl font-bold text-blue-400 mb-1">50MB</div>
                        <div className="text-xs text-gray-500">Max Size</div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Quizzes - Medium Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                viewport={{ once: true }}
                className="sm:col-span-2"
              >
                <Card className="h-full group overflow-hidden shadow-zinc-950/5 sm:rounded-none sm:rounded-tr-xl hover:border-purple-500/50 transition-all duration-300">
                  <p className="mx-auto my-6 max-w-md text-balance px-6 text-center text-lg font-semibold sm:text-2xl md:p-6">
                    AI-Generated Quizzes
                  </p>

                  <CardContent className="mt-auto h-fit px-6 pb-6">
                    <div className="relative">
                      <motion.div 
                        className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-950 p-6 mb-4"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Brain className="w-6 h-6 text-purple-500" />
                          </motion.div>
                          <span className="font-medium">Quiz Mode</span>
                        </div>
                        <div className="space-y-3 mb-6">
                          <motion.div 
                            className="bg-gray-200 dark:bg-zinc-800 p-3 rounded-lg border border-gray-300 dark:border-zinc-700"
                            whileHover={{ y: -2 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <div className="h-2 bg-purple-500/50 rounded w-full mb-2"></div>
                            <div className="h-2 bg-purple-500/50 rounded w-3/4"></div>
                          </motion.div>
                          <motion.div 
                            className="bg-gray-200 dark:bg-zinc-800 p-3 rounded-lg border border-gray-300 dark:border-zinc-700"
                            whileHover={{ y: -2 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <div className="h-2 bg-purple-500/30 rounded w-5/6 mb-2"></div>
                            <div className="h-2 bg-purple-500/30 rounded w-2/3"></div>
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-800">
                          <span className="text-xs text-gray-500">Auto-generated</span>
                          <span className="text-xs text-purple-400 font-medium">Multiple choice</span>
                        </div>
                      </motion.div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div 
                          className="p-3 bg-gray-100 dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 text-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-lg font-bold text-purple-400 mb-1">3</div>
                          <div className="text-xs text-gray-500">Difficulty Levels</div>
                        </motion.div>
                        <motion.div 
                          className="p-3 bg-gray-100 dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 text-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-lg font-bold text-purple-400 mb-1">∞</div>
                          <div className="text-xs text-gray-500">Questions</div>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Collaboration Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                viewport={{ once: true }}
                className="sm:col-span-2"
              >
                <Card className="h-full group p-6 shadow-black/5 sm:rounded-none sm:rounded-bl-xl md:p-12 hover:border-green-500/50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="bg-green-500/10 p-2 rounded-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Users className="w-6 h-6 text-green-500" />
                    </motion.div>
                    <p className="text-lg font-semibold">Collaboration</p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
                    Share documents, notes, and quizzes with your study group in real-time.
                  </p>

                  <div className="flex justify-center gap-3">
                    {['A', 'B', 'C'].map((letter, i) => (
                      <motion.div
                        key={letter}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg",
                          i === 0 && "bg-gradient-to-br from-blue-400 to-blue-600",
                          i === 1 && "bg-gradient-to-br from-purple-400 to-purple-600",
                          i === 2 && "bg-gradient-to-br from-green-400 to-green-600"
                        )}
                        whileHover={{ scale: 1.2, y: -5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {letter}
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* AI Chat Assistant Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                viewport={{ once: true }}
                className="sm:col-span-3"
              >
                <Card className="h-full group relative shadow-black/5 sm:rounded-none sm:rounded-br-xl hover:border-orange-500/50 transition-all duration-300">
                  <CardHeader className="p-6 md:p-12">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div 
                        className="bg-orange-500/10 p-2 rounded-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                      </motion.div>
                      <p className="font-medium text-lg">AI Chat Assistant</p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-sm text-sm">
                      Ask questions about your documents and get instant, intelligent
                      responses powered by advanced AI.
                    </p>
                  </CardHeader>
                  <CardContent className="relative h-fit px-6 pb-6 md:px-12 md:pb-12">
                    <motion.div 
                      className="bg-gray-100 dark:bg-zinc-950 p-6 rounded-lg border border-gray-200 dark:border-zinc-800"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="space-y-4">
                        <motion.div 
                          className="flex gap-3"
                          initial={{ x: -20, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="h-2 bg-orange-500/50 rounded w-3/4 mb-2"></div>
                            <div className="h-2 bg-orange-500/50 rounded w-1/2"></div>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex gap-3 justify-end"
                          initial={{ x: 20, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          <div className="flex-1 text-right">
                            <div className="h-2 bg-blue-500/50 rounded w-2/3 mb-2 ml-auto"></div>
                            <div className="h-2 bg-blue-500/50 rounded w-1/2 ml-auto"></div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0"></div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-transparent relative z-10 py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Loved by Students Worldwide
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                See what our users have to say about transforming their learning experience
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Computer Science Student",
                  avatar: "SJ",
                  content: "StudyPDF helped me improve my grades by 40%! The AI summaries are incredibly accurate and save me hours of reading time.",
                  rating: 5,
                  color: "blue"
                },
                {
                  name: "Michael Chen",
                  role: "Engineering Graduate",
                  avatar: "MC",
                  content: "The quiz generation feature is a game-changer. I can test my understanding immediately after reading. Highly recommend!",
                  rating: 5,
                  color: "purple"
                },
                {
                  name: "Emma Rodriguez",
                  role: "Medical Student",
                  avatar: "ER",
                  content: "Being able to collaborate with my study group and share summaries has made learning so much more efficient. Love it!",
                  rating: 5,
                  color: "green"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="relative group"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 h-full relative overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-300">
                    {/* Quote Icon */}
                    <Quote className="absolute top-6 right-6 w-12 h-12 text-gray-300 dark:text-zinc-800 opacity-50" />
                    
                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + i * 0.05 }}
                          viewport={{ once: true }}
                        >
                          <Star className={cn(
                            "w-5 h-5 fill-current",
                            testimonial.color === "blue" && "text-blue-500",
                            testimonial.color === "purple" && "text-purple-500",
                            testimonial.color === "green" && "text-green-500"
                          )} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed relative z-10">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white",
                          testimonial.color === "blue" && "bg-gradient-to-br from-blue-500 to-blue-600",
                          testimonial.color === "purple" && "bg-gradient-to-br from-purple-500 to-purple-600",
                          testimonial.color === "green" && "bg-gradient-to-br from-green-500 to-green-600"
                        )}
                      >
                        {testimonial.avatar}
                      </motion.div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>

                    {/* Hover Glow */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10",
                      testimonial.color === "blue" && "bg-blue-500/5",
                      testimonial.color === "purple" && "bg-purple-500/5",
                      testimonial.color === "green" && "bg-green-500/5"
                    )} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8"
            >
              {[
                { icon: Shield, text: "Secure & Private" },
                { icon: Zap, text: "Lightning Fast" },
                { icon: Users, text: "Trusted by 10K+" },
              ].map((badge, index) => {
                const BadgeIcon = badge.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <BadgeIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{badge.text}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="features" className="bg-transparent relative z-10 py-12 md:py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of students and professionals who are already learning
              smarter with AI-powered tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="group relative overflow-hidden px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all"
                  >
                    <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
                      Get Started Free
                    </span>
                    <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-black/10 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                    </i>
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 rounded-lg border-2 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Login to Your Account
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • Free forever plan available
            </p>
          </div>
        </section>

      </main>
    </>
  );
}

export default LandingPageNew;
