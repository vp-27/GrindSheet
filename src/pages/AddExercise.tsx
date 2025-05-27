import React, { useState, useMemo } from 'react';
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
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';

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

  // Get selected category and exercise for styling
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
  
  // Get category colors for styling
  const categoryColors = useMemo(() => {
    if (!selectedCategory) return null;
    const categoryKey = getCategoryKeyByName(selectedCategory.name);
    return getCategoryColors(categoryKey);
  }, [selectedCategory]);

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

  return (
    <Layout title="Log Exercise">
      <div className="flex flex-col gap-6 pb-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="p-2 h-auto rounded-full hover:bg-muted transition-colors" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {selectedCategory && categoryColors && (
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm"
                style={{ 
                  backgroundColor: `${categoryColors.primary}15`,
                  borderColor: `${categoryColors.primary}30`,
                  color: categoryColors.primary 
                }}
              >
                {selectedCategory.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Exercise Selection Form */}
        <div className="relative">
          {/* Subtle background glow */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
            style={{ backgroundColor: categoryColors?.primary || '#10b981' }}
          />
          
          <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl border border-gray-200/30 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Exercise Details</h3>
              <p className="text-sm text-gray-500">Select your exercise and log your performance</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                  >
                    <SelectTrigger 
                      id="category" 
                      className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 h-12"
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200/60 bg-white/95 backdrop-blur-md">
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id} className="rounded-lg">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="exercise" className="text-sm font-medium text-gray-700">
                    Exercise
                  </Label>
                  <Select
                    value={selectedExerciseId}
                    onValueChange={setSelectedExerciseId}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger 
                      id="exercise" 
                      className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 h-12"
                    >
                      <SelectValue placeholder={
                        selectedCategoryId 
                          ? "Select an exercise" 
                          : "Select a category first"
                      } />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200/60 bg-white/95 backdrop-blur-md">
                      {filteredExercises.length > 0 ? (
                        filteredExercises.map(exercise => (
                          <SelectItem key={exercise.id} value={exercise.id} className="rounded-lg">
                            {exercise.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled className="rounded-lg">
                          No exercises found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Weight (lbs)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 text-lg h-12"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Note (optional)
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this set..."
                  rows={3}
                  className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
                style={{ 
                  backgroundColor: categoryColors?.primary || '#10b981',
                  boxShadow: `0 4px 20px ${categoryColors?.primary || '#10b981'}30`
                }}
                disabled={isSubmitting || !selectedExerciseId || !weight}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging...
                  </div>
                ) : (
                  'Log Exercise'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddExercise;
