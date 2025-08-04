import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast-utils';
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
      
      if (editingCategory) {
        toast.success({
          title: 'Category updated',
          description: 'Your category has been updated successfully.',
        });
      } else {
        toast.categoryAdded(data.name);
      }
      
      form.reset({ name: '', description: '' });
      onOpenChange(false);
      
      if (onSuccess && response.data[0]) {
        onSuccess(response.data[0]);
      }
    } catch (error: any) {
      toast.error({
        title: 'Error',
        description: error.message || 'An error occurred.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="enhanced-dialog-content">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="enhanced-dialog-header">
            <DialogTitle className="enhanced-dialog-title">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="enhanced-dialog-description">
              {editingCategory 
                ? 'Update the category details below' 
                : 'Create a new category for organizing exercises'}
            </DialogDescription>
          </div>
          
          <div className="enhanced-form-group">
            <label htmlFor="category-name" className="enhanced-label">
              Name
            </label>
            <input
              id="category-name"
              {...form.register('name', { required: true })}
              className="enhanced-input"
              placeholder="Chest"
              required
            />
          </div>
          
          <div className="enhanced-form-group">
            <label htmlFor="category-description" className="enhanced-label">
              Description (Optional)
            </label>
            <input
              id="category-description"
              {...form.register('description')}
              className="enhanced-input"
              placeholder="Chest exercises"
            />
          </div>
          
          <div className="enhanced-dialog-footer">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="enhanced-button-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="enhanced-button-primary"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
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
      
      if (editingExercise) {
        toast.success({
          title: 'Exercise updated',
          description: 'Your exercise has been updated successfully.',
        });
      } else {
        toast.exerciseAdded(data.name);
      }
      
      form.reset({ name: '', description: '', categoryId: selectedCategoryId || '' });
      onOpenChange(false);
      
      if (onSuccess && response.data[0]) {
        onSuccess(response.data[0]);
      }
    } catch (error: any) {
      toast.error({
        title: 'Error',
        description: error.message || 'An error occurred.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="enhanced-dialog-content">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="enhanced-dialog-header">
            <DialogTitle className="enhanced-dialog-title">
              {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
            </DialogTitle>
            <DialogDescription className="enhanced-dialog-description">
              {editingExercise 
                ? 'Update the exercise details below' 
                : 'Add a new exercise to track your progress'}
            </DialogDescription>
          </div>
          
          <div className="enhanced-form-group">
            <label htmlFor="exercise-name" className="enhanced-label">
              Name
            </label>
            <input
              id="exercise-name"
              {...form.register('name', { required: true })}
              className="enhanced-input"
              placeholder="Bench Press"
              required
            />
          </div>
          
          <div className="enhanced-form-group">
            <label htmlFor="exercise-description" className="enhanced-label">
              Description (Optional)
            </label>
            <input
              id="exercise-description"
              {...form.register('description')}
              className="enhanced-input"
              placeholder="Barbell bench press"
            />
          </div>
          
          <div className="enhanced-form-group">
            <label htmlFor="exercise-category" className="enhanced-label">
              Category
            </label>
            <select
              id="exercise-category"
              {...form.register('categoryId', { required: true })}
              className="enhanced-input"
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
          
          <div className="enhanced-dialog-footer">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="enhanced-button-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="enhanced-button-primary"
            >
              {editingExercise ? 'Update Exercise' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
