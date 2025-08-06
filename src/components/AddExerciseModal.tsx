import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mobileToast } from '@/lib/mobile-toast-utils';
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
  preselectedExerciseId?: string;
  preselectedCategoryId?: string;
}

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onOpenChange, preselectedExerciseId, preselectedCategoryId }) => {
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

  // Reset form when modal closes or opens, using preselected values if provided
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId('');
      setSelectedExerciseId('');
      setWeight('');
      setNote('');
    } else {
      setSelectedCategoryId(preselectedCategoryId || '');
      setSelectedExerciseId(''); // Set exercise after category
    }
  }, [isOpen, preselectedCategoryId]);

  // When category changes and preselectedExerciseId is provided, set exercise if it matches
  useEffect(() => {
    if (
      isOpen &&
      preselectedExerciseId &&
      selectedCategoryId &&
      localExercises.some(e => e.id === preselectedExerciseId && e.categoryId === selectedCategoryId)
    ) {
      setSelectedExerciseId(preselectedExerciseId);
    }
  }, [isOpen, preselectedExerciseId, selectedCategoryId, localExercises]);

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
      mobileToast.critical('Missing information', 'Please select an exercise and enter the weight.');
      return;
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue < 0) {
      mobileToast.critical('Invalid weight', 'Please enter a valid weight value (0 for bodyweight exercises).');
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
      
      mobileToast.exerciseLogged();
      
      onOpenChange(false);
    } catch (error) {
      mobileToast.genericError('Failed to log exercise. Please try again.');
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
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 bottom-16 rounded-t-3xl border-t border-border/30 dark:border-white/20",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => onOpenChange(false)}
        />
        
        {/* Modal content that slides up from bottom, behind navbar */}
        <div 
          className={cn(
            "absolute bottom-20 left-0 right-0 rounded-t-3xl transition-transform duration-500 ease-out",
            "mx-2 sm:mx-auto sm:max-w-md",
            // Use solid Apple Health card color (no transparency)
            "bg-white dark:bg-[#1c1c1e] border-t border-l border-r border-[rgba(255,255,255,0.3)] dark:border-none",
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
            <div className="w-12 h-1 bg-muted-foreground/30 dark:bg-white/40 rounded-full" />
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
                  <SelectTrigger className="flex-1 rounded-lg border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] focus:border-primary focus:ring-0 h-10 text-sm shadow-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="apple-card border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] backdrop-blur-md shadow-md">
                    {localCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="rounded-lg">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  aria-label="Add new category"
                  className="shrink-0 rounded-full h-10 w-10 flex items-center justify-center focus:outline-none brand-add-button group active:scale-95"
                >
                  <Plus className="h-4 w-4 transition-all duration-300 group-active:scale-110" />
                </button>
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
                  <SelectTrigger className="flex-1 rounded-lg border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] focus:border-primary focus:ring-0 h-10 text-sm shadow-sm">
                    <SelectValue placeholder={
                      selectedCategoryId 
                        ? "Select exercise" 
                        : "Category first"
                    } />
                  </SelectTrigger>
                  <SelectContent className="apple-card border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] backdrop-blur-md shadow-md">
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map((exercise) => (
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
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(true)}
                  disabled={!selectedCategoryId}
                  aria-label="Add new exercise"
                  className={cn(
                    "shrink-0 rounded-full h-10 w-10 flex items-center justify-center focus:outline-none transition-all duration-300 group",
                    !selectedCategoryId 
                      ? "brand-add-button opacity-50 cursor-not-allowed" 
                      : "shadow-lg active:scale-95"
                  )}
                  style={selectedCategoryId && categoryColors ? {
                    backgroundColor: categoryColors.primary,
                    boxShadow: `0 8px 16px -4px ${categoryColors.primary}40, 0 4px 8px -2px ${categoryColors.primary}30`,
                    color: 'white'
                  } : undefined}
                >
                  <Plus className={cn(
                    "h-4 w-4 transition-all duration-300",
                    selectedCategoryId ? "group-active:scale-110" : ""
                  )} />
                </button>
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
                className="w-full rounded-xl border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] focus:border-primary focus:ring-0 text-lg h-12 shadow-sm"
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
                className="resize-none h-20 rounded-xl border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] focus:border-primary focus:ring-0 shadow-sm"
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
