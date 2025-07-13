import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AuthModal from '../components/AuthModal';
import { 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  ArrowRight,
  Play,
  CheckCircle,
  UserCheck,
  Sparkles,
  Globe,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, setGuest } = useStore();

  const handleGuestAccess = () => {
    setGuest(true);
    navigate('/dashboard');
  };

  const features = [
    {
      icon: Brain,
      title: 'Multi-Agent Architecture',
      description: 'Specialized AI agents work together to generate contextually aware synthetic data'
    },
    {
      icon: Shield,
      title: 'Privacy-Preserving',
      description: 'Advanced techniques ensure synthetic data maintains utility while protecting sensitive information'
    },
    {
      icon: Database,
      title: 'Multi-Modal Generation',
      description: 'Generate tabular, time-series, text, and image data with preserved relationships'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor data quality, bias detection, and model performance in real-time'
    },
    {
      icon: Zap,
      title: 'Adaptive Learning',
      description: 'Continuously improves synthetic data quality based on model training feedback'
    },
    {
      icon: Users,
      title: 'Cross-Domain Transfer',
      description: 'Learn patterns from one industry to enhance synthetic data generation in others'
    }
  ];

  const industries = [
    { name: 'Healthcare', icon: '🏥', color: 'from-green-500 to-emerald-500' },
    { name: 'Finance', icon: '💰', color: 'from-blue-500 to-cyan-500' },
    { name: 'Retail', icon: '🛍️', color: 'from-purple-500 to-pink-500' },
    { name: 'Manufacturing', icon: '🏭', color: 'from-orange-500 to-red-500' },
    { name: 'Education', icon: '🎓', color: 'from-yellow-500 to-amber-500' },
    { name: 'Technology', icon: '💻', color: 'from-indigo-500 to-blue-500' }
  ];

  const stats = [
    { label: 'Data Models Trained', value: '10M+', icon: Brain },
    { label: 'Industries Supported', value: '15+', icon: Globe },
    { label: 'Privacy Compliance', value: '99.9%', icon: Shield },
    { label: 'Quality Accuracy', value: '97.2%', icon: Award },
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Chief Data Scientist, HealthTech Innovations',
      content: 'DataGenesis AI revolutionized our medical research. The synthetic patient data maintains all statistical properties while ensuring complete privacy.',
      avatar: '👩‍⚕️'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'VP of Analytics, FinanceForward',
      content: 'The cross-domain learning capabilities are incredible. Our financial models improved by 40% using healthcare-derived patterns.',
      avatar: '👨‍💼'
    },
    {
      name: 'Elena Volkov',
      role: 'ML Engineer, RetailAI Corp',
      content: 'Multi-agent orchestration delivers unmatched quality. Our customer behavior predictions are now 95% accurate.',
      avatar: '👩‍💻'
    }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.1),transparent_50%)]"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <motion.div 
            className="text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <motion.div 
                className="relative"
                animate={{ 
                  rotateY: [0, 360],
                  rotateX: [0, 360]
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl relative">
                  <Brain className="w-14 h-14 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-lg opacity-50"></div>
                </div>
              </motion.div>
              </div>
            
            <motion.h1 
              className="text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              DataGenesis AI
            </motion.h1>
            
            <motion.p 
              className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Revolutionary <span className="text-purple-400 font-semibold">multi-agent</span> synthetic data generation platform powered by{' '}
              <span className="text-pink-400 font-semibold">Gemini 2.0 Flash</span> that intelligently creates 
              high-quality datasets across healthcare, finance, retail, and beyond
            </motion.p>

            <motion.div 
              className="flex items-center justify-center gap-6 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-6 h-6 text-purple-400 mr-2" />
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={() => {
                  if (user) {
                    navigate('/dashboard');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="px-10 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-xl font-bold text-white text-lg hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-3 shadow-2xl relative overflow-hidden group"
                whileHover={{ scale: 1.05, rotateX: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Sparkles className="w-6 h-6" />
                {user ? 'Enter Platform' : 'Start Free Trial'}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                onClick={handleGuestAccess}
                className="px-8 py-4 bg-gray-800/80 backdrop-blur-xl border-2 border-gray-700 rounded-xl font-semibold text-white hover:bg-gray-700/80 hover:border-purple-500 transition-all duration-300 flex items-center gap-3 group"
                whileHover={{ scale: 1.05, rotateX: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserCheck className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
                Enter as Guest
              </motion.button>
              
              <motion.button
                className="px-8 py-4 bg-transparent border-2 border-gray-600 rounded-xl font-semibold text-white hover:bg-white/10 hover:border-white transition-all duration-300 flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </div>

            <motion.div 
              className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Privacy-First Design
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Enterprise Ready
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative py-32 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Organizations worldwide rely on DataGenesis AI to accelerate their machine learning initiatives
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden group"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed italic">"{testimonial.content}"</p>
                  <div className="flex items-center mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Revolutionary AI Technology</span>
            </div>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Next-Generation Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Advanced capabilities powered by cutting-edge AI that set DataGenesis apart from traditional solutions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl hover:border-purple-500/50 transition-all duration-500 relative overflow-hidden"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, rotateX: 5 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Industries Section */}
      <div className="relative py-32 bg-gradient-to-b from-gray-800/30 to-gray-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Universal Domain Expertise
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our AI agents automatically adapt and excel across any industry or domain, learning and improving continuously
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                className={`group p-8 bg-gradient-to-br ${industry.color} rounded-2xl text-center hover:scale-110 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-2xl`}
                initial={{ scale: 0, opacity: 0, rotateY: -180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ rotateY: 10, rotateX: 10 }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">
                    {industry.icon}
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-yellow-200 transition-colors">
                    {industry.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div 
            className="text-center p-16 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-2xl rounded-3xl border border-gray-700/50 relative overflow-hidden"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            
            <div className="relative">
              <motion.div
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 mb-8"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-medium">Join 50,000+ ML Engineers</span>
              </motion.div>
              
              <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Ready to Transform Your Data Strategy?
              </h2>
              <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join the future of synthetic data generation and unlock unprecedented insights with DataGenesis AI
              </p>
              
              <motion.button
                onClick={() => {
                  if (user) {
                    navigate('/dashboard');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="px-16 py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-2xl font-bold text-white text-xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 transition-all duration-300 shadow-2xl relative overflow-hidden group"
                whileHover={{ scale: 1.05, rotateX: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  {user ? 'Enter the Future' : 'Start Your Journey'}
                  <ArrowRight className="w-6 h-6" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Landing;