import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';
import { CategoryDialog, ExerciseDialog } from '@/components/ui/shared-dialogs';
import { Plus } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onOpenChange }) => {
  const { categories, exercises, addExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Modal states for adding new categories/exercises
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId('');
      setSelectedExerciseId('');
      setWeight('');
      setNote('');
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onOpenChange]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -100; // Swipe down threshold
    
    if (isDownSwipe) {
      onOpenChange(false);
    }
  };

  // Filter exercises based on selected category
  const filteredExercises = localExercises.filter(exercise => 
    exercise.categoryId === selectedCategoryId
  );

  // Get selected category for styling
  const selectedCategory = localCategories.find(cat => cat.id === selectedCategoryId);
  const categoryColors = useMemo(() => {
    if (!selectedCategory) return null;
    const categoryKey = getCategoryKeyByName(selectedCategory.name);
    return getCategoryColors(categoryKey);
  }, [selectedCategory]);

  // Handlers for adding new categories/exercises
  const handleCategoryAdded = (newCategory: any) => {
    setLocalCategories(prev => [...prev, newCategory]);
    setSelectedCategoryId(newCategory.id);
    setIsAddCategoryOpen(false);
  };

  const handleExerciseAdded = (newExercise: any) => {
    const exerciseWithCategoryId = { ...newExercise, categoryId: newExercise.category_id };
    setLocalExercises(prev => [...prev, exerciseWithCategoryId]);
    setSelectedExerciseId(newExercise.id);
    setIsAddExerciseOpen(false);
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
        weightUnit: 'lbs'
      });
      
      toast({
        title: 'Exercise logged',
        description: 'Your exercise has been successfully logged!',
      });
      
      onOpenChange(false);
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
    <>
      {/* Custom modal that slides up from behind navbar */}
      <div className={cn(
        "fixed inset-0 z-40 transition-all duration-300",
        isOpen ? "visible" : "invisible"
      )}>
        {/* Backdrop - only covers the main content area, not navbar */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 bottom-16 rounded-t-3xl border-t border-border/16",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => onOpenChange(false)}
        />
        
        {/* Modal content that slides up from bottom, behind navbar */}
        <div 
          className={cn(
            "absolute bottom-20 left-0 right-0 bg-background rounded-t-3xl transition-transform duration-500 ease-out",
            "mx-2 sm:mx-auto sm:max-w-md",
            "border-t border-border/20",
            isOpen ? "translate-y-0" : "translate-y-full"
          )}
          style={categoryColors ? {
            boxShadow: `0 -8px 32px ${categoryColors.primary}30, 0 -4px 16px ${categoryColors.primary}20, 0 8px 32px rgba(0,0,0,0.1)`
          } : {
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle bar for visual feedback and swipe area */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Modal header */}
          <div className="px-6 pb-4">
            <h2 className="text-xl font-bold">Log Exercise</h2>
            <p className="text-sm text-muted-foreground">
              Quickly log your exercise with weight and optional notes.
            </p>
          </div>
          
          {/* Modal form content */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="flex-1 rounded-lg border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 h-10 text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="apple-card border-border/60 backdrop-blur-md">
                    {localCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="rounded-lg">
                        {category.name}
                      </SelectItem>
                    ))}
                    <div className="border-t border-border/60 mt-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-sm text-muted-foreground active:text-foreground active:bg-muted/60 transition-colors"
                        onClick={() => setIsAddCategoryOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2 text-icon" />
                        Add New Category
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Exercise Selection */}
            <div className="space-y-2">
              <Label htmlFor="exercise">Exercise</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedExerciseId} 
                  onValueChange={setSelectedExerciseId}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger className="flex-1 rounded-lg border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 h-10 text-sm">
                    <SelectValue placeholder={
                      selectedCategoryId 
                        ? "Select exercise" 
                        : "Category first"
                    } />
                  </SelectTrigger>
                  <SelectContent className="apple-card border-border/60 backdrop-blur-md">
                    {filteredExercises.length > 0 ? (
                      <>
                        {filteredExercises.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id} className="rounded-lg">
                            {exercise.name}
                          </SelectItem>
                        ))}
                        <div className="border-t border-border/60 mt-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-sm text-muted-foreground active:text-foreground active:bg-muted/60 transition-colors"
                            onClick={() => setIsAddExerciseOpen(true)}
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
                              onClick={() => setIsAddExerciseOpen(true)}
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddExerciseOpen(true)}
                  disabled={!selectedCategoryId}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Weight Input */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
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
                className="w-full rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 text-lg h-12"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="note">Notes (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes about your set..."
                className="resize-none h-20 rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
              />
            </div>

            {/* Submit Button - Full Width */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedExerciseId || !weight}
                className="w-full h-12 text-base font-semibold rounded-2xl"
                style={categoryColors ? {
                  backgroundColor: categoryColors.primary,
                  borderColor: categoryColors.primary,
                } : undefined}
              >
                {isSubmitting ? 'Logging...' : 'Log Exercise'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modals for adding categories/exercises */}
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
    </>
  );
};

export default AddExerciseModal;
