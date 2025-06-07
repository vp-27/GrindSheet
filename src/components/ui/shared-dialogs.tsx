import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CategoryFormData {
  name: string;
  description: string;
}

interface ExerciseFormData {
  name: string;
  description: string;
  categoryId: string;
}

interface CategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory?: any;
  categories: any[];
  onSuccess?: (category: any) => void;
}

interface ExerciseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingExercise?: any;
  categories: any[];
  selectedCategoryId?: string;
  onSuccess?: (exercise: any) => void;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  isOpen,
  onOpenChange,
  editingCategory,
  categories,
  onSuccess
}) => {
  const { toast } = useToast();
  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: editingCategory?.name || '',
      description: editingCategory?.description || '',
    }
  });

  // Update form when editingCategory changes
  React.useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name || '',
        description: editingCategory.description || '',
      });
    } else {
      form.reset({ name: '', description: '' });
    }
  }, [editingCategory, form]);

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      let response;
      
      if (editingCategory) {
        // Update existing category
        response = await supabase
          .from('categories')
          .update({
            name: data.name,
            description: data.description,
          })
          .eq('id', editingCategory.id)
          .select();
      } else {
        // Insert new category
        response = await supabase
          .from('categories')
          .insert({
            name: data.name,
            description: data.description,
          })
          .select();
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: editingCategory ? 'Category updated' : 'Category added',
        description: editingCategory 
          ? 'Your category has been updated successfully.' 
          : 'Your new category has been added successfully.',
      });
      
      form.reset({ name: '', description: '' });
      onOpenChange(false);
      
      if (onSuccess && response.data[0]) {
        onSuccess(response.data[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full rounded-2xl backdrop-blur-sm bg-card/95 border-border/50 mobile-dialog">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-foreground mobile-dialog-title">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mobile-dialog-description">
              {editingCategory 
                ? 'Update the category details below' 
                : 'Create a new category for organizing exercises'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 mobile-dialog-content">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-sm font-medium text-foreground mobile-label">
                Name
              </Label>
              <Input
                id="category-name"
                {...form.register('name', { required: true })}
                className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 mobile-input"
                placeholder="Chest"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description" className="text-sm font-medium text-foreground mobile-label">
                Description (Optional)
              </Label>
              <Input
                id="category-description"
                {...form.register('description')}
                className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 mobile-input"
                placeholder="Chest exercises"
              />
            </div>
          </div>
          <DialogFooter className="mobile-dialog-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl mobile-button-secondary"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl font-medium bg-primary active:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 mobile-button-primary"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ExerciseDialog: React.FC<ExerciseDialogProps> = ({
  isOpen,
  onOpenChange,
  editingExercise,
  categories,
  selectedCategoryId,
  onSuccess
}) => {
  const { toast } = useToast();
  const form = useForm<ExerciseFormData>({
    defaultValues: {
      name: editingExercise?.name || '',
      description: editingExercise?.description || '',
      categoryId: editingExercise?.category_id || selectedCategoryId || '',
    }
  });

  // Update form when editingExercise changes
  React.useEffect(() => {
    if (editingExercise) {
      form.reset({
        name: editingExercise.name || '',
        description: editingExercise.description || '',
        categoryId: editingExercise.category_id || '',
      });
    } else {
      form.reset({ 
        name: '', 
        description: '', 
        categoryId: selectedCategoryId || '' 
      });
    }
  }, [editingExercise, selectedCategoryId, form]);

  const handleSubmit = async (data: ExerciseFormData) => {
    try {
      let response;
      
      if (editingExercise) {
        // Update existing exercise
        response = await supabase
          .from('exercises')
          .update({
            name: data.name,
            description: data.description,
            category_id: data.categoryId,
          })
          .eq('id', editingExercise.id)
          .select();
      } else {
        // Insert new exercise
        response = await supabase
          .from('exercises')
          .insert({
            name: data.name,
            description: data.description,
            category_id: data.categoryId,
          })
          .select();
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: editingExercise ? 'Exercise updated' : 'Exercise added',
        description: editingExercise 
          ? 'Your exercise has been updated successfully.' 
          : 'Your new exercise has been added successfully.',
      });
      
      form.reset({ name: '', description: '', categoryId: selectedCategoryId || '' });
      onOpenChange(false);
      
      if (onSuccess && response.data[0]) {
        onSuccess(response.data[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full rounded-2xl backdrop-blur-sm bg-card/95 border-border/50 mobile-dialog">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-foreground mobile-dialog-title">
              {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mobile-dialog-description">
              {editingExercise 
                ? 'Update the exercise details below' 
                : 'Add a new exercise to track your progress'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 mobile-dialog-content">
            <div className="space-y-2">
              <Label htmlFor="exercise-name" className="text-sm font-medium text-foreground mobile-label">
                Name
              </Label>
              <Input
                id="exercise-name"
                {...form.register('name', { required: true })}
                className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 mobile-input"
                placeholder="Bench Press"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise-description" className="text-sm font-medium text-foreground mobile-label">
                Description (Optional)
              </Label>
              <Input
                id="exercise-description"
                {...form.register('description')}
                className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 mobile-input"
                placeholder="Barbell bench press"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise-category" className="text-sm font-medium text-foreground mobile-label">
                Category
              </Label>
              <select
                id="exercise-category"
                {...form.register('categoryId', { required: true })}
                className="w-full p-2.5 border border-border/60 rounded-xl text-sm focus:outline-none bg-background/80 text-foreground focus:border-primary mobile-select"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="mobile-dialog-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl mobile-button-secondary"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl font-medium bg-primary active:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 mobile-button-primary"
            >
              {editingExercise ? 'Update Exercise' : 'Add Exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
