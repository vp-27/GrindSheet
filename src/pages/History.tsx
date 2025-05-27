import React, { useState } from 'react';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';

const History = () => {
  const { exerciseLogs, exercises, categories, updateExerciseLog, deleteExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const [editLog, setEditLog] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ weight: '', note: '' });

  // Group logs by date
  const logsByDate = React.useMemo(() => {
    const grouped = {};
    
    exerciseLogs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(log);
    });
    
    return grouped;
  }, [exerciseLogs]);
  
  // Sort dates in descending order
  const sortedDates = React.useMemo(() => {
    return Object.keys(logsByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [logsByDate]);
  
  // Find exercise and category names
  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };
  
  const getCategoryForExercise = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;
    
    const category = categories.find(c => c.id === exercise.categoryId);
    return category;
  };

  // Edit dialog handlers
  const openEditDialog = (log) => {
    setEditLog(log);
    setEditForm({ weight: log.weight, note: log.note || '' });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLog) return;
    await updateExerciseLog({ ...editLog, weight: Number(editForm.weight), note: editForm.note });
    setEditDialogOpen(false);
    setEditLog(null);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Delete this log?')) {
      await deleteExerciseLog(logId);
    }
  };

  return (
    <Layout title="History">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">Workout History</h1>
        
        {sortedDates.length === 0 && (
          <div className="text-center p-8 border border-border rounded bg-card">
            <p className="text-muted-foreground">No workout history found. Start logging exercises to see your history!</p>
          </div>
        )}
        
        {sortedDates.map(date => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            
            <Card>
              {logsByDate[date].map(log => {
                const exerciseName = getExerciseName(log.exerciseId);
                const category = getCategoryForExercise(log.exerciseId);
                const categoryKey = category ? getCategoryKeyByName(category.name) : undefined;
                const categoryColors = categoryKey ? getCategoryColors(categoryKey) : undefined;
                return (
                  <CardContent 
                    key={log.id} 
                    className={`p-4 border-b last:border-0 transition-shadow ${categoryColors ? categoryColors.shadow : ''}`}
                    style={categoryColors ? { boxShadow: `0 2px 12px 0 ${categoryColors.primary}22` } : {}}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <div className="font-medium text-foreground">{exerciseName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), 'h:mm a')}
                          {log.note && <span> - {log.note}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="font-bold text-foreground">{log.weight} lb</div>
                        {category && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColors ? categoryColors.text : ''}`} style={categoryColors ? { background: categoryColors.light, color: categoryColors.primary } : {}}>
                            {category.name}
                          </span>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="icon" className="border-border hover:bg-muted" onClick={() => openEditDialog(log)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="border-border text-red-500 hover:text-red-600 hover:bg-muted" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                );
              })}
            </Card>
          </div>
        ))}

        {/* Edit Exercise Log Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Exercise Log</DialogTitle>
                <DialogDescription>Update the weight or note for this log. Date and time cannot be changed.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    value={editForm.weight}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Input
                    id="note"
                    name="note"
                    value={editForm.note}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <div className="text-sm text-muted-foreground">
                    {editLog && format(new Date(editLog.timestamp), 'EEEE, MMMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Update Log</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default History;
