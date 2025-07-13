
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Database, 
  Settings, 
  Brain, 
  Shield,
  Activity
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/generator', icon: Database, label: 'Data Generator' },
  { path: '/analytics', icon: Activity, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar: React.FC = () => {
  return (
    <motion.div 
      className="w-64 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 p-6 flex flex-col h-full overflow-hidden"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">DataGenesis</h1>
          <p className="text-xs text-gray-400">AI Platform</p>
        </div>
      </div>

      <nav className="space-y-2 flex-shrink-0">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">AI Agents</span>
        </div>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Privacy Agent
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Quality Agent
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Domain Expert
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Relationship Agent
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
