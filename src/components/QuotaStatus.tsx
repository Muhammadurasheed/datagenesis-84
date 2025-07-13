import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface QuotaInfo {
  provider: string;
  status: string;
  limits?: {
    daily_datasets: number;
    hourly_requests: number;
  };
  usage?: {
    daily: number;
    hourly: number;
  };
  remaining?: {
    daily: number;
    hourly: number;
  };
  reset_times?: {
    daily: string;
    hourly: string;
  };
}

interface QuotaStatusProps {
  provider: string;
  className?: string;
}

export const QuotaStatus: React.FC<QuotaStatusProps> = ({ provider, className = "" }) => {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotaStatus();
  }, [provider]);

  const fetchQuotaStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/quota/status?provider=${provider}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch quota status');
      }
      
      setQuotaInfo(data.quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Quota status error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading quota status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load quota: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!quotaInfo) return null;

  const getStatusIcon = () => {
    if (quotaInfo.status === 'unlimited') return <Zap className="h-4 w-4 text-green-500" />;
    if (quotaInfo.status === 'tracked') return <Clock className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-gray-500" />;
  };


  const calculateProgress = (used: number, total: number) => {
    if (total === -1) return 0; // Unlimited
    return Math.min((used / total) * 100, 100);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="capitalize">{provider} Quota</span>
          </div>
          <Badge variant={quotaInfo.status === 'unlimited' ? 'default' : 'secondary'}>
            {quotaInfo.status === 'unlimited' ? 'Unlimited' : 'Tracked'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {quotaInfo.status === 'unlimited' ? (
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <Zap className="h-3 w-3" />
            <span>No quota limits for local processing</span>
          </div>
        ) : (
          quotaInfo.limits && quotaInfo.usage && quotaInfo.remaining && (
            <>
              {/* Daily Datasets */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Daily Datasets</span>
                  <span className="font-medium">
                    {quotaInfo.remaining.daily === -1 ? 'Unlimited' : 
                     `${quotaInfo.remaining.daily} / ${quotaInfo.limits.daily_datasets} remaining`}
                  </span>
                </div>
                {quotaInfo.remaining.daily !== -1 && (
                  <Progress 
                    value={calculateProgress(quotaInfo.usage.daily, quotaInfo.limits.daily_datasets)}
                    className="h-2"
                  />
                )}
              </div>

              {/* Hourly Requests */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Hourly Requests</span>
                  <span className="font-medium">
                    {quotaInfo.remaining.hourly === -1 ? 'Unlimited' :
                     `${quotaInfo.remaining.hourly} / ${quotaInfo.limits.hourly_requests} remaining`}
                  </span>
                </div>
                {quotaInfo.remaining.hourly !== -1 && (
                  <Progress 
                    value={calculateProgress(quotaInfo.usage.hourly, quotaInfo.limits.hourly_requests)}
                    className="h-2"
                  />
                )}
              </div>

              {/* Reset Times */}
              {quotaInfo.reset_times && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <div>Daily reset: {quotaInfo.reset_times.daily}</div>
                  <div>Hourly reset: {quotaInfo.reset_times.hourly}</div>
                </div>
              )}

              {/* Warnings */}
              {quotaInfo.remaining.daily !== -1 && quotaInfo.remaining.daily < 10 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Low quota remaining. Consider switching to Ollama for unlimited local generation.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )
        )}
      </CardContent>
    </Card>
  );
};