
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  return (
    <Layout title="Add Exercise">
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          className="w-fit -ml-2 mb-2"
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold">Log Exercise</h1>
        
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger id="category">
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
              <Label htmlFor="exercise">Exercise</Label>
              <Select
                value={selectedExerciseId}
                onValueChange={setSelectedExerciseId}
                disabled={!selectedCategoryId}
              >
                <SelectTrigger id="exercise">
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
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.5"
                min="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="Enter weight"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note about this set"
                rows={3}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging...' : 'Log Exercise'}
              <PlusCircle className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddExercise;
