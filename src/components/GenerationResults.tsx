import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database,
  Edit3,
  RefreshCw,
  Sparkles,
  BarChart3,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface GenerationMetrics {
  quality_score: number;
  privacy_score: number;
  bias_score: number;
  diversity_score: number;
  coherence_score: number;
  statistical_fidelity: number;
}

interface GenerationResult {
  data: any[];
  metadata: {
    rows_generated: number;
    columns_generated: number;
    generation_time: string;
    model_used: string;
    provider: string;
    metrics: GenerationMetrics;
    job_id: string;
    created_at: string;
  };
}

interface GenerationResultsProps {
  result: GenerationResult;
  onRegenerate: () => void;
  onEdit: (newDescription: string) => void;
  isEditing?: boolean;
}

const GenerationResults: React.FC<GenerationResultsProps> = ({ 
  result, 
  onRegenerate, 
  onEdit, 
  isEditing = false 
}) => {
  const [editDescription, setEditDescription] = useState('');
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [isRegenerating, setIsRegenerating] = useState(false);
  

  const { data, metadata } = result;
  const { metrics } = metadata;

  // Calculate overall grade
  const calculateOverallGrade = () => {
    const scores = [
      metrics.quality_score,
      metrics.privacy_score,
      metrics.bias_score,
      metrics.diversity_score,
      metrics.coherence_score,
      metrics.statistical_fidelity
    ];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (average >= 90) return { grade: 'A+', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (average >= 80) return { grade: 'A', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (average >= 70) return { grade: 'B+', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    if (average >= 60) return { grade: 'B', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    if (average >= 50) return { grade: 'C', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { grade: 'D', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const overallGrade = calculateOverallGrade();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const downloadData = (format: 'csv' | 'json' | 'excel') => {
    if (!data.length) return;

    let blob: Blob;
    let filename: string;

    try {
      switch (format) {
        case 'csv':
          const csv = Papa.unparse(data);
          blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          filename = `synthetic_data_${metadata.job_id}.csv`;
          break;
        case 'json':
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = `synthetic_data_${metadata.job_id}.json`;
          break;
        case 'excel':
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Synthetic Data');
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          filename = `synthetic_data_${metadata.job_id}.xlsx`;
          break;
        default:
          return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
      toast.success('Data regeneration started');
    } catch (error) {
      toast.error('Failed to start regeneration');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleEdit = () => {
    if (editDescription.trim()) {
      onEdit(editDescription);
      setEditDescription('');
      toast.success('Regenerating with new description');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Overall Grade */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl ${overallGrade.bgColor} border border-current/20`}>
            <span className={`text-2xl font-bold ${overallGrade.color}`}>
              {overallGrade.grade}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Generation Results</h2>
            <p className="text-gray-400">
              Generated on {new Date(metadata.created_at).toLocaleDateString()} using {metadata.provider} {metadata.model_used}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDataPreview(!showDataPreview)}
            className="border-purple-500/30 hover:bg-purple-500/20"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showDataPreview ? 'Hide' : 'Preview'} Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="border-blue-500/30 hover:bg-blue-500/20"
          >
            {isRegenerating ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metadata.rows_generated}</p>
                <p className="text-sm text-gray-400">Records Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metadata.columns_generated}</p>
                <p className="text-sm text-gray-400">Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(metrics.quality_score)}%</p>
                <p className="text-sm text-gray-400">Quality Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metadata.generation_time}</p>
                <p className="text-sm text-gray-400">Generation Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                label: 'Data Quality', 
                score: metrics.quality_score, 
                icon: CheckCircle,
                description: 'Overall data accuracy and completeness'
              },
              { 
                label: 'Privacy Protection', 
                score: metrics.privacy_score, 
                icon: Shield,
                description: 'Level of anonymization and privacy preservation'
              },
              { 
                label: 'Bias Mitigation', 
                score: metrics.bias_score, 
                icon: Users,
                description: 'Fairness and representation across demographics'
              },
              { 
                label: 'Data Diversity', 
                score: metrics.diversity_score, 
                icon: Sparkles,
                description: 'Variety and richness of generated patterns'
              },
              { 
                label: 'Coherence', 
                score: metrics.coherence_score, 
                icon: Activity,
                description: 'Logical consistency and relationships'
              },
              { 
                label: 'Statistical Fidelity', 
                score: metrics.statistical_fidelity, 
                icon: BarChart3,
                description: 'Preservation of original data distributions'
              }
            ].map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getScoreIcon(metric.score)}
                    <span className={`text-sm font-bold ${getScoreColor(metric.score)}`}>
                      {Math.round(metric.score)}%
                    </span>
                  </div>
                </div>
                <Progress value={metric.score} className="h-2" />
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <AnimatePresence>
        {showDataPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Data Preview (First 10 rows)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {Object.keys(data[0] || {}).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          {Object.values(row).map((value: any, colIndex) => (
                            <td key={colIndex} className="px-4 py-2 text-sm text-gray-300">
                              {String(value).length > 50 
                                ? `${String(value).substring(0, 50)}...` 
                                : String(value)
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit and Download Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5 text-green-400" />
              Refine Data Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe how you'd like to modify the generated data..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              rows={4}
            />
            <Button
              onClick={handleEdit}
              disabled={!editDescription.trim() || isEditing}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {isEditing ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Edit3 className="w-4 h-4 mr-2" />
              )}
              Regenerate with Changes
            </Button>
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Download className="w-5 h-5 text-purple-400" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { format: 'csv' as const, icon: FileText, label: 'CSV' },
                { format: 'json' as const, icon: Database, label: 'JSON' },
                { format: 'excel' as const, icon: FileSpreadsheet, label: 'Excel' }
              ].map(({ format, icon: Icon, label }) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                  className={selectedFormat === format 
                    ? "bg-purple-500 hover:bg-purple-600" 
                    : "border-gray-600 hover:bg-gray-700"
                  }
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => downloadData(selectedFormat)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Download {selectedFormat.toUpperCase()}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default GenerationResults;