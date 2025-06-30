import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Edit, Trash2, MapPin, Calendar } from 'lucide-react';

const VillageCard = ({ village, onEdit, onDelete, loading }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(village.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'ไม่ระบุ';
    }
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">{village.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            ID: {village.id?.slice(0, 8)}...
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          สร้างเมื่อ: {formatDate(village.created_at)}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {village.updated_at && village.updated_at !== village.created_at && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              แก้ไขล่าสุด: {formatDate(village.updated_at)}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(village)}
            disabled={loading}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            แก้ไข
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading || deleteLoading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                ลบ
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการลบหมู่บ้าน</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณแน่ใจหรือไม่ที่จะลบหมู่บ้าน "{village.name}"? 
                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? 'กำลังลบ...' : 'ลบ'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VillageCard;

