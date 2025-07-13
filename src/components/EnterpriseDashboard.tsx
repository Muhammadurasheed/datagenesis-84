import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Database, 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  Eye,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useStore } from '../store/useStore';
import { useModel } from './ModelProvider';

interface DashboardStats {
  totalGenerations: number;
  totalRecords: number;
  averageQuality: number;
  recentJobs: Array<{
    id: string;
    type: string;
    status: 'completed' | 'running' | 'failed';
    records: number;
    created_at: string;
    quality_score?: number;
  }>;
  monthlyStats: Array<{
    month: string;
    generations: number;
    records: number;
  }>;
}

const EnterpriseDashboard: React.FC = () => {
  const { user, isGuest } = useStore();
  const { currentModel } = useModel();
  const [stats, setStats] = useState<DashboardStats>({
    totalGenerations: 0,
    totalRecords: 0,
    averageQuality: 0,
    recentJobs: [],
    monthlyStats: []
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadDashboardStats();
  }, [selectedTimeframe]);

  const loadDashboardStats = async () => {
    // Mock data for demonstration - replace with real API calls
    const mockStats: DashboardStats = {
      totalGenerations: 247,
      totalRecords: 1250000,
      averageQuality: 87.5,
      recentJobs: [
        {
          id: 'job_001',
          type: 'User Profiles',
          status: 'completed',
          records: 10000,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          quality_score: 92
        },
        {
          id: 'job_002',
          type: 'Transaction Data',
          status: 'running',
          records: 5000,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          quality_score: 89
        },
        {
          id: 'job_003',
          type: 'Product Catalog',
          status: 'completed',
          records: 25000,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          quality_score: 85
        },
        {
          id: 'job_004',
          type: 'Customer Reviews',
          status: 'failed',
          records: 0,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
      ],
      monthlyStats: [
        { month: 'Oct', generations: 45, records: 225000 },
        { month: 'Nov', generations: 62, records: 310000 },
        { month: 'Dec', generations: 78, records: 390000 },
        { month: 'Jan', generations: 62, records: 315000 }
      ]
    };

    setStats(mockStats);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'running':
        return 'text-blue-400 bg-blue-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">
            {isGuest ? 'Guest Dashboard' : `Welcome back, ${user?.email?.split('@')[0] || 'User'}`}
          </h1>
          <p className="text-gray-400">
            Monitor your synthetic data generation activity and performance
          </p>
        </div>
        
        {currentModel && (
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-medium">{currentModel.provider}</span>
            <span className="text-purple-200 text-sm">{currentModel.model}</span>
          </div>
        )}
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Generations</p>
                <p className="text-2xl font-bold text-white">{stats.totalGenerations}</p>
                <p className="text-blue-200 text-xs">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-500/30 rounded-lg">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Records Generated</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalRecords)}</p>
                <p className="text-green-200 text-xs">+25% from last month</p>
              </div>
              <div className="p-3 bg-green-500/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Average Quality</p>
                <p className="text-2xl font-bold text-white">{stats.averageQuality}%</p>
                <p className="text-purple-200 text-xs">+3% from last month</p>
              </div>
              <div className="p-3 bg-purple-500/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-white">42</p>
                <p className="text-orange-200 text-xs">+8% from last month</p>
              </div>
              <div className="p-3 bg-orange-500/30 rounded-lg">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Generation Trends</CardTitle>
              <div className="flex gap-2">
                {['7d', '30d', '90d'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe as any)}
                    className="h-8 px-3 text-xs"
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthlyStats.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{month.month}</p>
                        <p className="text-gray-400 text-sm">{month.generations} generations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatNumber(month.records)}</p>
                      <p className="text-gray-400 text-sm">records</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Jobs */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Recent Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="text-white font-medium">{job.type}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(job.created_at).toLocaleDateString()} • {formatNumber(job.records)} records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.quality_score && (
                        <div className="text-right">
                          <p className="text-white text-sm font-medium">{job.quality_score}%</p>
                          <Progress value={job.quality_score} className="w-16 h-1" />
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Database className="w-4 h-4 mr-2" />
                New Generation
              </Button>
              <Button variant="outline" className="border-gray-600 hover:bg-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="border-gray-600 hover:bg-gray-700">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EnterpriseDashboard;