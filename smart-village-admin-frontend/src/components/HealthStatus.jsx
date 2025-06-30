import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  Server, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  Database
} from 'lucide-react';

const HealthStatus = ({ health, loading, error, onRefresh }) => {
  const getStatusColor = (isHealthy) => {
    return isHealthy ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (isHealthy) => {
    return isHealthy ? 'ปกติ' : 'มีปัญหา';
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'ไม่ทราบ';
    
    const seconds = Math.floor(uptime);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} วัน ${hours % 24} ชั่วโมง`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes % 60} นาที`;
    } else if (minutes > 0) {
      return `${minutes} นาที`;
    } else {
      return `${seconds} วินาที`;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'ไม่ทราบ';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              สถานะระบบ
            </CardTitle>
            <CardDescription>
              ตรวจสอบสถานะการเชื่อมต่อ Backend API
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ไม่สามารถเชื่อมต่อกับ Backend API ได้: {error}
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            กำลังตรวจสอบสถานะ...
          </div>
        )}

        {health && !loading && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(health.success)}`} />
              <span className="font-medium">
                สถานะ API: {getStatusText(health.success)}
              </span>
              <Badge variant={health.success ? 'default' : 'destructive'}>
                {health.status || 'Unknown'}
              </Badge>
            </div>

            {/* System Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">การเชื่อมต่อ</p>
                  <p className="text-xs text-muted-foreground">
                    {health.success ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อไม่ได้'}
                  </p>
                </div>
              </div>

              {/* Server Status */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Server className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">เซิร์ฟเวอร์</p>
                  <p className="text-xs text-muted-foreground">
                    {health.environment || 'Unknown'} Environment
                  </p>
                </div>
              </div>

              {/* Uptime */}
              {health.uptime && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">เวลาทำงาน</p>
                    <p className="text-xs text-muted-foreground">
                      {formatUptime(health.uptime)}
                    </p>
                  </div>
                </div>
              )}

              {/* Version */}
              {health.version && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">เวอร์ชัน</p>
                    <p className="text-xs text-muted-foreground">
                      {health.version}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamp */}
            {health.timestamp && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                ตรวจสอบล่าสุด: {formatTimestamp(health.timestamp)}
              </div>
            )}
          </div>
        )}

        {!health && !loading && !error && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              คลิก "รีเฟรช" เพื่อตรวจสอบสถานะระบบ
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthStatus;

