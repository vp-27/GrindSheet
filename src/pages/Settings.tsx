import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { ChevronRight, Edit2, Plus, Trash2, Pencil, LogOut, Folder, Palette, Dumbbell, Sun, Moon, Monitor } from 'lucide-react';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';
import '@/components/ui/color-indicator.css';

const Settings: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [deletableItems, setDeletableItems] = useState({ categories: new Set(), exercises: new Set() });
  
  // Helper function to get CSS class name for category
  const getCategoryClassName = (categoryKey: string) => {
    const validKeys = ['arms', 'back', 'chest', 'core', 'legs', 'shoulders'];
    return validKeys.includes(categoryKey) ? `category-${categoryKey}` : 'category-default';
  };
  
  const profileForm = useForm({
    defaultValues: {
      name: '',
      username: '',
      avatarUrl: '',
    }
  });

  const categoryForm = useForm({
    defaultValues: {
      name: '',
      description: '',
    }
  });
  
  const exerciseForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
    }
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Update profile form when profile data is loaded
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || '',
        username: profile.username || '',
        avatarUrl: profile.avatar_url || '',
      });
    }
  }, [profile]);

  // Fetch categories and exercises
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch all categories (shared across all users)
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch all exercises (shared across all users)
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .order('name');
          
        if (exercisesError) throw exercisesError;
        setExercises(exercisesData || []);
        
        // Check which items can be deleted
        await checkDeletableItems(categoriesData || [], exercisesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error loading data',
          description: 'Failed to load your categories and exercises.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Helper function to check which categories and exercises can be deleted
  const checkDeletableItems = async (categories: any[], exercises: any[]) => {
    if (!user) return;

    const deletableCategoryIds = new Set<string>();
    const deletableExerciseIds = new Set<string>();

    // Fetch all exercise logs not belonging to the current user
    const { data: otherUserLogsData, error: otherUserLogsError } = await supabase
      .from('exercise_logs')
      .select('exercise_id')
      .neq('user_id', user.id);

    if (otherUserLogsError) {
      console.error('Error fetching other user logs:', otherUserLogsError);
      // Fallback: assume nothing is deletable to be safe
      setDeletableItems({ categories: new Set(), exercises: new Set() });
      return;
    }

    const protectedExerciseIds = new Set(otherUserLogsData?.map(log => log.exercise_id) || []);

    // Determine deletable exercises
    for (const exercise of exercises) {
      if (!protectedExerciseIds.has(exercise.id)) {
        deletableExerciseIds.add(exercise.id);
      }
    }

    // Determine deletable categories
    for (const category of categories) {
      const exercisesInCategory = exercises.filter(ex => ex.category_id === category.id);
      // A category is deletable if all its exercises are deletable
      // (or if it has no exercises)
      const isCategoryDeletable = exercisesInCategory.every(ex => deletableExerciseIds.has(ex.id));
      
      if (isCategoryDeletable) {
        deletableCategoryIds.add(category.id);
      }
    }
    
    setDeletableItems({
      categories: deletableCategoryIds,
      exercises: deletableExerciseIds
    });
  };

  const handleProfileSubmit = async (data) => {
    try {
      const { error } = await updateProfile(data);
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      setIsEditProfileOpen(false);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update profile.',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async (data) => {
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
        // Insert new category (global for all users)
        response = await supabase
          .from('categories')
          .insert({
            name: data.name,
            description: data.description,
          })
          .select();
      }
      
      if (response.error) throw response.error;
      
      // Refresh categories - get all categories
      const { data: refreshedCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      setCategories(refreshedCategories || []);
      
      // Refresh exercises for consistency
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
        
      // Refresh deletable items
      await checkDeletableItems(refreshedCategories || [], refreshedExercises || []);
      
      toast({
        title: editingCategory ? 'Category updated' : 'Category added',
        description: editingCategory 
          ? 'Your category has been updated successfully.' 
          : 'Your new category has been added successfully.',
      });
      
      categoryForm.reset({ name: '', description: '' });
      setIsAddCategoryOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleAddExercise = async (data) => {
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
            user_id: user?.id,
            name: data.name,
            description: data.description,
            category_id: data.categoryId,
          })
          .select();
      }
      
      if (response.error) throw response.error;
      
      // Refresh exercises - get all exercises
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
        
      setExercises(refreshedExercises || []);
      
      // Refresh categories for consistency
      const { data: refreshedCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      // Refresh deletable items
      await checkDeletableItems(refreshedCategories || [], refreshedExercises || []);
      
      toast({
        title: editingExercise ? 'Exercise updated' : 'Exercise added',
        description: editingExercise 
          ? 'Your exercise has been updated successfully.' 
          : 'Your new exercise has been added successfully.',
      });
      
      exerciseForm.reset({ name: '', description: '', categoryId: '' });
      setIsAddExerciseOpen(false);
      setEditingExercise(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || '',
    });
    setIsAddCategoryOpen(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    exerciseForm.reset({
      name: exercise.name,
      description: exercise.description || '',
      categoryId: exercise.category_id,
    });
    setIsAddExerciseOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    // Check if this category can be deleted
    if (!deletableItems.categories.has(categoryId)) {
      toast({
        title: 'Cannot delete category',
        description: 'Other users have logged exercises in this category. You cannot delete it.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!confirm('Are you sure you want to delete this category? This will also delete all exercises in this category.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
        
      if (error) throw error;
      
      // Refresh categories - get all categories
      const { data: refreshedCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      setCategories(refreshedCategories || []);
      
      // Also refresh exercises as some might have been deleted
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
        
      setExercises(refreshedExercises || []);
      
      // Refresh deletable items
      await checkDeletableItems(refreshedCategories || [], refreshedExercises || []);
      
      toast({
        title: 'Category deleted',
        description: 'The category and its exercises have been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete category.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    // Check if this exercise can be deleted
    if (!deletableItems.exercises.has(exerciseId)) {
      toast({
        title: 'Cannot delete exercise',
        description: 'Other users have logged this exercise. You cannot delete it.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);
        
      if (error) throw error;
      
      // Refresh exercises - get all exercises
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
        
      setExercises(refreshedExercises || []);
      
      // Refresh categories for consistency  
      const { data: refreshedCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      // Refresh deletable items
      await checkDeletableItems(refreshedCategories || [], refreshedExercises || []);
      
      toast({
        title: 'Exercise deleted',
        description: 'The exercise has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete exercise.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      
      if (error) throw error;
      
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'An error occurred while logging out.',
        variant: 'destructive',
      });
    }
  };

  if (!user || !profile) {
    return (
      <Layout title="Settings">
        <div className="flex justify-center items-center h-64">
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Settings">
      <div className="flex flex-col gap-6 pb-6">
        {/* Profile Section - Clean Apple-style */}
        <div className="relative">
          <div className="flex items-center gap-6 p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 shadow-sm">
            <Avatar className="h-20 w-20 ring-2 ring-border/20">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg font-semibold">
                {profile.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground mb-1 truncate">{profile.name}</h1>
              <p className="text-muted-foreground truncate">@{profile.username}</p>
            </div>
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-muted transition-colors h-11 w-11"
                >
                  <Edit2 className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl backdrop-blur-sm bg-card/95 border-border/50">
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Update your profile information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">Name</Label>
                      <Input
                        id="name"
                        value={profileForm.watch('name')}
                        onChange={(e) => profileForm.setValue('name', e.target.value)}
                        className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-foreground">Username</Label>
                      <Input
                        id="username"
                        value={profileForm.watch('username')}
                        onChange={(e) => profileForm.setValue('username', e.target.value)}
                        className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl" className="text-sm font-medium text-foreground">Avatar URL</Label>
                      <Input
                        id="avatarUrl"
                        value={profileForm.watch('avatarUrl')}
                        onChange={(e) => profileForm.setValue('avatarUrl', e.target.value)}
                        className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                        placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=YourName"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="w-full h-11 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200"
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                <Palette className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light' as const, label: 'Light', icon: 'Sun' },
                { value: 'dark' as const, label: 'Dark', icon: 'Moon' },
                { value: 'system' as const, label: 'System', icon: 'Monitor' }
              ].map((themeOption) => {
                const isSelected = theme === themeOption.value;
                const IconComponent = themeOption.icon === 'Sun' ? Sun : 
                                     themeOption.icon === 'Moon' ? Moon : Monitor;
                
                return (
                  <Button
                    key={themeOption.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-20 p-3 flex flex-col gap-2 rounded-xl transition-all duration-200 ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-md border-primary' 
                        : 'bg-background/60 border-border/60 hover:bg-background/80 text-foreground hover:border-border'
                    }`}
                    onClick={() => setTheme(themeOption.value)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{themeOption.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Categories Management */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">Categories</h3>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  categoryForm.reset({ name: '', description: '' });
                  setIsAddCategoryOpen(true);
                }}
                className="h-10 px-4 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" /> 
                Add Category
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => {
                  const categoryKey = getCategoryKeyByName(category.name);
                  const colors = getCategoryColors(categoryKey);
                  const canDelete = deletableItems.categories.has(category.id);
                  
                  return (
                    <div 
                      key={category.id} 
                      className={`apple-health-card group category-colored-card ${getCategoryClassName(categoryKey)}`}
                    >
                      {/* Top row: Category name + Actions */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="apple-health-card-title">
                          {category.name}
                        </h3>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-8 w-8 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={!canDelete}
                            className={`h-8 w-8 rounded-lg ${
                              canDelete 
                                ? 'text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30' 
                                : 'text-muted-foreground/40 cursor-not-allowed'
                            }`}
                            title={canDelete ? 'Delete category' : 'Cannot delete - used by other users'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Description if exists */}
                      {category.description && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        </div>
                      )}

                      {/* Bottom row: Status */}
                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full category-indicator-dot"
                          />
                          <span className="text-sm text-muted-foreground">
                            {exercises.filter(ex => ex.category_id === category.id).length} exercises
                          </span>
                        </div>
                        
                        {!canDelete && (
                          <div className="apple-health-progress-badge protected-badge">
                            Protected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No categories found. Create your first category!
              </div>
            )}
          </div>

          {/* Exercises Management */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">Exercises</h3>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setEditingExercise(null);
                  exerciseForm.reset({ name: '', description: '', categoryId: '' });
                  setIsAddExerciseOpen(true);
                }}
                className="h-10 px-4 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" /> 
                Add Exercise
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading exercises...</div>
            ) : exercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map(exercise => {
                  const category = categories.find(c => c.id === exercise.category_id);
                  const categoryKey = category ? getCategoryKeyByName(category.name) : 'default';
                  const colors = getCategoryColors(categoryKey);
                  const canDelete = deletableItems.exercises.has(exercise.id);
                  
                  return (
                    <div 
                      key={exercise.id} 
                      className={`apple-health-card group category-colored-card ${getCategoryClassName(categoryKey)}`}
                    >
                      {/* Top row: Exercise name + Actions */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="apple-health-card-title">
                          {exercise.name}
                        </h3>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                            className="h-8 w-8 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteExercise(exercise.id)}
                            disabled={!canDelete}
                            className={`h-8 w-8 rounded-lg ${
                              canDelete 
                                ? 'text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30' 
                                : 'text-muted-foreground/40 cursor-not-allowed'
                            }`}
                            title={canDelete ? 'Delete exercise' : 'Cannot delete - used by other users'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Description if exists */}
                      {exercise.description && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {exercise.description}
                          </p>
                        </div>
                      )}

                      {/* Bottom row: Category and status */}
                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full category-indicator-dot"
                          />
                          <span className="text-sm text-muted-foreground">
                            {category?.name || 'Uncategorized'}
                          </span>
                        </div>
                        
                        {!canDelete && (
                          <div className="apple-health-progress-badge protected-badge">
                            Protected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No exercises found. Create your first exercise!
              </div>
            )}
          </div>

          {/* Logout Section */}
          <div 
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-6 shadow-sm cursor-pointer hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-colors group"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Sign Out</h3>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Modals for editing exercises and categories */}
      <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl backdrop-blur-sm bg-card/95 border-border/50">
          <form onSubmit={exerciseForm.handleSubmit(handleAddExercise)}>
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingExercise ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingExercise 
                  ? 'Update the exercise details below' 
                  : 'Add a new exercise to track your progress'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">Name</Label>
                <Input
                  id="name"
                  value={exerciseForm.watch('name')}
                  onChange={(e) => exerciseForm.setValue('name', e.target.value)}
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                  placeholder="Bench Press"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Description (Optional)</Label>
                <Input
                  id="description"
                  value={exerciseForm.watch('description')}
                  onChange={(e) => exerciseForm.setValue('description', e.target.value)}
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                  placeholder="Barbell bench press"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-foreground">Category</Label>
                <select
                  id="category"
                  title="Select exercise category"
                  value={exerciseForm.watch('categoryId')}
                  onChange={(e) => exerciseForm.setValue('categoryId', e.target.value)}
                  className="w-full p-2.5 border border-border/60 rounded-xl text-sm focus:outline-none bg-background/80 text-foreground focus:border-primary"
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
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200"
              >
                {editingExercise ? 'Update Exercise' : 'Add Exercise'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl backdrop-blur-sm bg-card/95 border-border/50">
          <form onSubmit={categoryForm.handleSubmit(handleAddCategory)}>
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingCategory 
                  ? 'Update the category details below' 
                  : 'Create a new category for organizing exercises'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">Name</Label>
                <Input
                  id="name"
                  value={categoryForm.watch('name')}
                  onChange={(e) => categoryForm.setValue('name', e.target.value)}
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                  placeholder="Chest"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Description (Optional)</Label>
                <Input
                  id="description"
                  value={categoryForm.watch('description')}
                  onChange={(e) => categoryForm.setValue('description', e.target.value)}
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
                  placeholder="Chest exercises"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Settings;
