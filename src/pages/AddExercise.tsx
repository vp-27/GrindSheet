import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus } from 'lucide-react';
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
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';
import { CategoryDialog, ExerciseDialog } from '@/components/ui/shared-dialogs';

const AddExercise = () => {
  const { categories, exercises, addExerciseLog } = useAppContext();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New modal states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [localExercises, setLocalExercises] = useState(exercises);

  // Update local state when context changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    setLocalExercises(exercises);
  }, [exercises]);

  // Filter exercises based on selected category
  const filteredExercises = localExercises.filter(exercise => 
    exercise.categoryId === selectedCategoryId
  );

  // Get selected category and exercise for styling
  const selectedCategory = localCategories.find(cat => cat.id === selectedCategoryId);
  const selectedExercise = localExercises.find(ex => ex.id === selectedExerciseId);
  
  // Get category colors for styling
  const categoryColors = useMemo(() => {
    if (!selectedCategory) return null;
    const categoryKey = getCategoryKeyByName(selectedCategory.name);
    return getCategoryColors(categoryKey);
  }, [selectedCategory]);

  // Handler for when a new category is successfully added
  const handleCategoryAdded = (newCategory: any) => {
    setLocalCategories(prev => [...prev, newCategory]);
    setSelectedCategoryId(newCategory.id); // Auto-select the new category
  };

  // Handler for when a new exercise is successfully added
  const handleExerciseAdded = (newExercise: any) => {
    const exerciseWithCategoryId = { ...newExercise, categoryId: newExercise.category_id };
    setLocalExercises(prev => [...prev, exerciseWithCategoryId]);
    setSelectedExerciseId(newExercise.id); // Auto-select the new exercise
  };

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

    // Validate weight is a valid positive number
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight value.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addExerciseLog({
        userId: profile?.id || '',
        exerciseId: selectedExerciseId,
        weight: weightValue,
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
        {/* Exercise Selection Form */}
        <div className="relative">
          {/* Subtle background glow */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
            style={{ backgroundColor: categoryColors?.primary || '#10b981' }}
          />
          
          <div className="relative backdrop-blur-sm bg-card/90 rounded-2xl border border-border/30 p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Exercise Details</h3>
                <p className="text-sm text-muted-foreground">Select your exercise and log your performance</p>
              </div>
              {selectedCategory && categoryColors && (
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
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs sm:text-sm font-medium text-foreground">
                    Category
                  </Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                  >
                    <SelectTrigger 
                      id="category" 
                      className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 h-10 sm:h-12 text-sm"
                    >
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-md">
                      {localCategories.map(category => (
                        <SelectItem key={category.id} value={category.id} className="rounded-lg">
                          {category.name}
                        </SelectItem>
                      ))}
                      <div className="border-t border-border/60 mt-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start text-sm text-muted-foreground active:text-foreground active:bg-muted/60 transition-colors"
                          onClick={() => {
                            setIsAddCategoryOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2 text-icon" />
                          Add New Category
                        </Button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exercise" className="text-xs sm:text-sm font-medium text-foreground">
                    Exercise
                  </Label>
                  <Select
                    value={selectedExerciseId}
                    onValueChange={setSelectedExerciseId}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger 
                      id="exercise" 
                      className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 h-10 sm:h-12 text-sm"
                    >
                      <SelectValue placeholder={
                        selectedCategoryId 
                          ? "Exercise" 
                          : "Category first"
                      } />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-md">
                      {filteredExercises.length > 0 ? (
                        <>
                          {filteredExercises.map(exercise => (
                            <SelectItem key={exercise.id} value={exercise.id} className="rounded-lg">
                              {exercise.name}
                            </SelectItem>
                          ))}
                          <div className="border-t border-border/60 mt-2 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-sm text-muted-foreground active:text-foreground active:bg-muted/60 transition-colors"
                              onClick={() => {
                                setIsAddExerciseOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2 text-icon" />
                              Add New Exercise
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <SelectItem value="none" disabled className="rounded-lg">
                            No exercises found
                          </SelectItem>
                          {selectedCategoryId && (
                            <div className="border-t border-border/60 mt-2 pt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-sm text-muted-foreground active:text-foreground active:bg-muted/60 transition-colors"
                                onClick={() => {
                                  setIsAddExerciseOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2 text-icon" />
                                Add New Exercise
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-foreground">
                  Weight (lbs)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  value={weight}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow numeric input (including decimals)
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setWeight(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters except for allowed keys
                    if (!/[0-9.]/.test(e.key) && 
                        !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter weight"
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 text-lg h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-foreground">
                  Note (optional)
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this set..."
                  rows={3}
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-medium text-white shadow-lg transition-all duration-200 active:shadow-xl active:scale-[0.98] bg-primary active:bg-primary/90 text-primary-foreground"
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

      {/* Shared Dialog Components */}
      <CategoryDialog
        isOpen={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
        categories={localCategories}
        onSuccess={handleCategoryAdded}
      />

      <ExerciseDialog
        isOpen={isAddExerciseOpen}
        onOpenChange={setIsAddExerciseOpen}
        categories={localCategories}
        selectedCategoryId={selectedCategoryId}
        onSuccess={handleExerciseAdded}
      />
    </Layout>
  );
};

export default AddExercise;
