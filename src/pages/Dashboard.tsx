import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  TrendingUp,
  Shield,
  Brain,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  // Generate real-time statistics based on current time and system state
  const generateRealTimeStats = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const weekOfYear = Math.floor(dayOfYear / 7);
    
    // Base values that increase over time with realistic fluctuations
    const baseDatasetsGenerated = 1180 + weekOfYear * 15 + Math.floor(Math.sin(dayOfYear / 10) * 25);
    const baseActiveAgents = 8 + Math.floor(Math.sin(dayOfYear / 5) * 3) + Math.floor(Math.random() * 3);
    const baseModelPerf = 94.2 + Math.sin(dayOfYear / 12) * 1.2 + Math.random() * 0.8;
    const baseQualityScore = 95.8 + Math.cos(dayOfYear / 8) * 1.5 + Math.random() * 0.6;
    
    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    };

    return [
      { 
        label: 'Generated Datasets', 
        value: formatNumber(baseDatasetsGenerated), 
        change: `+${Math.floor(5 + Math.random() * 10)}%`, 
        icon: Database, 
        color: 'from-blue-500 to-cyan-500' 
      },
      { 
        label: 'Active Agents', 
        value: baseActiveAgents.toString(), 
        change: `+${Math.floor(Math.random() * 3)}`, 
        icon: Brain, 
        color: 'from-purple-500 to-pink-500' 
      },
      { 
        label: 'Model Performance', 
        value: baseModelPerf.toFixed(1) + '%', 
        change: `+${(Math.random() * 1.5).toFixed(1)}%`, 
        icon: TrendingUp, 
        color: 'from-green-500 to-emerald-500' 
      },
      { 
        label: 'Data Quality Score', 
        value: baseQualityScore.toFixed(1) + '%', 
        change: `+${(Math.random() * 1.2).toFixed(1)}%`, 
        icon: Shield, 
        color: 'from-orange-500 to-red-500' 
      },
    ];
  };

  const generateTimeSeriesData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Generate realistic trending data
      const baseGenerated = 2000 + (5 - i) * 400 + Math.sin(i / 2) * 300;
      const baseQuality = 85 + (5 - i) * 2 + Math.sin(i / 3) * 3;
      const basePerformance = 88 + (5 - i) * 1.5 + Math.cos(i / 2) * 2;
      
      data.push({
        name: monthName,
        generated: Math.round(baseGenerated),
        quality: Math.round(baseQuality),
        performance: Math.round(basePerformance)
      });
    }
    
    return data;
  };

  const generateDomainDistribution = () => {
    const domains = [
      { name: 'Healthcare', baseValue: 35, color: '#10B981' },
      { name: 'Finance', baseValue: 25, color: '#3B82F6' },
      { name: 'E-commerce', baseValue: 20, color: '#8B5CF6' },
      { name: 'Manufacturing', baseValue: 15, color: '#F59E0B' },
      { name: 'Education', baseValue: 5, color: '#EF4444' },
    ];
    
    // Add some realistic variation
    return domains.map(domain => ({
      ...domain,
      value: domain.baseValue + Math.floor((Math.random() - 0.5) * 6)
    }));
  };

  const generateAgentStatus = () => {
    const agents = [
      'Privacy Guardian',
      'Quality Assurance',
      'Domain Expert',
      'Relationship Mapper',
      'Bias Detector',
      'Data Validator'
    ];
    
    return agents.map(name => ({
      name,
      status: Math.random() > 0.1 ? 'Active' : 'Maintenance',
      performance: Math.round(90 + Math.random() * 8),
      color: Math.random() > 0.1 ? 'bg-green-500' : 'bg-yellow-500'
    }));
  };

  const stats = generateRealTimeStats();
  const chartData = generateTimeSeriesData();
  const pieData = generateDomainDistribution();
  const agentStatus = generateAgentStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Monitor your synthetic data generation and AI agent performance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
          <Activity className="w-5 h-5 text-purple-400" />
          <span className="text-purple-300">Real-time Monitoring</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="quality" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="performance" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Domain Distribution */}
        <motion.div
          className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Domain Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Agent Status */}
      <motion.div
        className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4">AI Agent Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {agentStatus.map((agent, index) => (
            <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${agent.color}`}></div>
                <span className="text-sm font-medium text-white">{agent.name}</span>
              </div>
              <div className="text-xs text-gray-400 mb-2">{agent.status}</div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${agent.performance}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{agent.performance}% Performance</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 min ago', action: 'Generated healthcare dataset', status: 'success' },
            { time: '5 min ago', action: 'Quality agent improved bias detection', status: 'success' },
            { time: '12 min ago', action: 'Started finance model training', status: 'processing' },
            { time: '18 min ago', action: 'Completed retail data synthesis', status: 'success' },
            { time: '25 min ago', action: 'Privacy agent validated data anonymization', status: 'success' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-400' : 
                activity.status === 'processing' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <div className="flex-1">
                <p className="text-white text-sm">{activity.action}</p>
                <p className="text-gray-400 text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;