import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

const AddExercise = () => {
  const { categories, exercises, addExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter exercises based on selected category
  const filteredExercises = exercises.filter(exercise => 
    exercise.categoryId === selectedCategoryId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExerciseId || !weight) {
      toast({
        title: 'Missing information',
        description: 'Please select an exercise and enter the weight.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addExerciseLog({
        userId: profile?.id || '',
        exerciseId: selectedExerciseId,
        weight: parseFloat(weight),
        note: note,
        weightUnit: 'lbs' // Always use lbs now
      });
      
      toast({
        title: 'Exercise logged',
        description: 'Your exercise has been successfully logged!',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log exercise. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);

  return (
    <Layout title="Log Exercise">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="ghost" 
            className="p-0 h-auto" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <Card className="shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader className="pb-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-gray-900">
                {selectedExercise ? selectedExercise.name : 'Log Exercise'}
              </CardTitle>
              <Dumbbell className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700 text-sm">Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger id="category" className="border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exercise" className="text-gray-700 text-sm">Exercise</Label>
                <Select
                  value={selectedExerciseId}
                  onValueChange={setSelectedExerciseId}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger id="exercise" className="border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder={
                      selectedCategoryId 
                        ? "Select an exercise" 
                        : "Select a category first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map(exercise => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No exercises found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-gray-700 text-sm">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note" className="text-gray-700 text-sm">Note (optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this set"
                  rows={3}
                  className="border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging...' : 'Log Exercise'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddExercise;
