import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { ChevronRight, ChevronDown, Edit2, Plus, Trash2, Pencil, LogOut, Folder, Palette, Dumbbell, Sun, Moon, Monitor, X } from 'lucide-react';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';
import { CategoryDialog, ExerciseDialog } from '@/components/ui/shared-dialogs';
import '@/components/ui/color-indicator.css';
import '@/components/ui/theme-selector.css';
import '@/components/ui/settings-animations.css';

const Settings: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Lazy loading states
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [exercisesOpen, setExercisesOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [exercisesLoaded, setExercisesLoaded] = useState(false);
  
  // Dialog states
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
      avatar_url: '',
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
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  // Lazy load categories when section is opened
  const fetchCategories = async () => {
    if (categoriesLoaded || categoriesLoading) return;
    
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
      setCategoriesLoaded(true);
      
      // Check which categories can be deleted
      await checkDeletableCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error loading categories',
        description: 'Failed to load categories.',
        variant: 'destructive',
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Lazy load exercises when section is opened
  const fetchExercises = async () => {
    if (exercisesLoaded || exercisesLoading) return;
    
    try {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
        
      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);
      setExercisesLoaded(true);
      
      // Check which exercises can be deleted
      await checkDeletableExercises(exercisesData || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: 'Error loading exercises',
        description: 'Failed to load exercises.',
        variant: 'destructive',
      });
    } finally {
      setExercisesLoading(false);
    }
  };

  // Handle categories section toggle
  const handleCategoriesToggle = async (open: boolean) => {
    if (open && !categoriesLoaded) {
      // Start loading but don't open yet
      setCategoriesLoading(true);
      await fetchCategories();
      // Only open after data is loaded
      setCategoriesOpen(true);
    } else {
      setCategoriesOpen(open);
    }
  };

  // Handle exercises section toggle
  const handleExercisesToggle = async (open: boolean) => {
    if (open && !exercisesLoaded) {
      // Ensure categories are loaded before loading exercises
      if (!categoriesLoaded && !categoriesLoading) {
        await fetchCategories(); // Don't set loading state here
      }
      // Start loading but don't open yet
      setExercisesLoading(true);
      await fetchExercises();
      // Only open after data is loaded
      setExercisesOpen(true);
    } else {
      setExercisesOpen(open);
    }
  };

  // Helper function to check which categories can be deleted
  const checkDeletableCategories = async (categories: any[]) => {
    if (!user) return;

    const deletableCategoryIds = new Set<string>();

    // Fetch all exercise logs not belonging to the current user
    const { data: otherUserLogsData, error: otherUserLogsError } = await supabase
      .from('exercise_logs')
      .select('exercise_id')
      .neq('user_id', user.id);

    if (otherUserLogsError) {
      console.error('Error fetching other user logs:', otherUserLogsError);
      setDeletableItems(prev => ({ ...prev, categories: new Set() }));
      return;
    }

    const protectedExerciseIds = new Set(otherUserLogsData?.map(log => log.exercise_id) || []);

    // Fetch all exercises to check category relationships
    const { data: allExercises } = await supabase
      .from('exercises')
      .select('*');

    // Determine deletable categories
    for (const category of categories) {
      const exercisesInCategory = (allExercises || []).filter(ex => ex.category_id === category.id);
      const isCategoryDeletable = exercisesInCategory.every(ex => !protectedExerciseIds.has(ex.id));
      
      if (isCategoryDeletable) {
        deletableCategoryIds.add(category.id);
      }
    }
    
    setDeletableItems(prev => ({
      ...prev,
      categories: deletableCategoryIds
    }));
  };

  // Helper function to check which exercises can be deleted
  const checkDeletableExercises = async (exercises: any[]) => {
    if (!user) return;

    const deletableExerciseIds = new Set<string>();

    // Fetch all exercise logs not belonging to the current user
    const { data: otherUserLogsData, error: otherUserLogsError } = await supabase
      .from('exercise_logs')
      .select('exercise_id')
      .neq('user_id', user.id);

    if (otherUserLogsError) {
      console.error('Error fetching other user logs:', otherUserLogsError);
      setDeletableItems(prev => ({ ...prev, exercises: new Set() }));
      return;
    }

    const protectedExerciseIds = new Set(otherUserLogsData?.map(log => log.exercise_id) || []);

    // Determine deletable exercises
    for (const exercise of exercises) {
      if (!protectedExerciseIds.has(exercise.id)) {
        deletableExerciseIds.add(exercise.id);
      }
    }
    
    setDeletableItems(prev => ({
      ...prev,
      exercises: deletableExerciseIds
    }));
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

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsAddCategoryOpen(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
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
      
      // Refresh categories
      await fetchCategories();
      
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
      
      // Refresh exercises
      await fetchExercises();
      
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
          <div className="flex items-center gap-6 p-6 apple-card shadow-sm">
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
                  className="rounded-full active:bg-muted transition-colors h-11 w-11"
                >
                  <Edit2 className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="enhanced-dialog-content">
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <div className="enhanced-dialog-header">
                    <DialogTitle className="enhanced-dialog-title">Edit Profile</DialogTitle>
                    <DialogDescription className="enhanced-dialog-description">
                      Update your profile information
                    </DialogDescription>
                  </div>
                  
                  <div className="enhanced-form-group">
                    <label htmlFor="name" className="enhanced-label">Name</label>
                    <input
                      id="name"
                      value={profileForm.watch('name')}
                      onChange={(e) => profileForm.setValue('name', e.target.value)}
                      className="enhanced-input"
                    />
                  </div>
                  
                  <div className="enhanced-form-group">
                    <label htmlFor="username" className="enhanced-label">Username</label>
                    <input
                      id="username"
                      value={profileForm.watch('username')}
                      onChange={(e) => profileForm.setValue('username', e.target.value)}
                      className="enhanced-input"
                    />
                  </div>
                  
                  <div className="enhanced-form-group">
                    <label htmlFor="avatar_url" className="enhanced-label">Avatar URL</label>
                    <input
                      id="avatar_url"
                      value={profileForm.watch('avatar_url')}
                      onChange={(e) => profileForm.setValue('avatar_url', e.target.value)}
                      className="enhanced-input"
                      placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=YourName"
                    />
                  </div>
                  
                  <div className="enhanced-dialog-footer">
                    <button 
                      type="submit" 
                      className="enhanced-button-primary w-full"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="apple-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                <Palette className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
            </div>
            
            {/* Animated Theme Selector */}
            <div 
              className="theme-selector-container"
              data-active={theme}
            >
              {/* Sliding Background Indicator */}
              <div className="theme-selector-slider" />
              
              {[
                { value: 'light' as const, label: 'Light', icon: 'Sun' },
                { value: 'dark' as const, label: 'Dark', icon: 'Moon' },
                { value: 'system' as const, label: 'System', icon: 'Monitor' }
              ].map((themeOption) => {
                const isSelected = theme === themeOption.value;
                const IconComponent = themeOption.icon === 'Sun' ? Sun : 
                                     themeOption.icon === 'Moon' ? Moon : Monitor;
                
                return (
                  <button
                    key={themeOption.value}
                    className={`theme-selector-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => setTheme(themeOption.value)}
                  >
                    <IconComponent className="theme-selector-icon" />
                    <span className="theme-selector-label">{themeOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Management - Collapsible */}
          <Collapsible open={categoriesOpen} onOpenChange={handleCategoriesToggle} className="collapsible-root">
            <div className="apple-card shadow-sm">
              <CollapsibleTrigger className="collapsible-trigger w-full p-6 cursor-pointer active:bg-muted/20 transition-colors rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h3 className="text-lg font-semibold text-foreground">Categories</h3>
                      <p className="text-sm text-muted-foreground">Manage exercise categories</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {categoriesLoading && (
                      <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                    )}
                    {categoriesLoaded && (
                      <span className="text-sm text-muted-foreground px-3 py-1 bg-muted/40 rounded-full">
                        {categories.length}
                      </span>
                    )}
                    <ChevronRight className="collapsible-chevron h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="smooth-collapsible-content">
                <div className="collapsible-inner px-6 pb-6">
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={() => {
                        setEditingCategory(null);
                        setIsAddCategoryOpen(true);
                      }}
                      className="h-10 px-4 rounded-xl font-medium bg-primary active:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" /> 
                      Add Category
                    </Button>
                  </div>
                  
                  {categoriesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
                  ) : categories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((category, index) => {
                        const categoryKey = getCategoryKeyByName(category.name);
                        const canDelete = deletableItems.categories.has(category.id);
                        
                        return (
                          <div 
                            key={category.id} 
                            className={`apple-health-card settings-card-item group category-colored-card ${getCategoryClassName(categoryKey)}`}
                          >
                            {/* Top row: Category name + Actions */}
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="apple-health-card-title">
                                {category.name}
                              </h3>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon"
                                  onClick={() => handleEditCategory(category)}
                                  className="h-8 w-8 rounded-full bg-[#14b8a6] text-white shadow-md hover:bg-[#10b981] active:bg-[#0e9e6e] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={!canDelete}
                                  className={`h-8 w-8 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${!canDelete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={canDelete ? 'Delete category' : 'Cannot delete - used by other users'}
                                >
                                  <X className="h-4 w-4" />
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
                                <div className="w-3 h-3 rounded-full category-indicator-dot" />
                                <span className="text-sm text-muted-foreground">
                                  {exercisesLoaded ? exercises.filter(ex => ex.category_id === category.id).length : '...'} exercises
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
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Exercises Management - Collapsible */}
          <Collapsible open={exercisesOpen} onOpenChange={handleExercisesToggle} className="collapsible-root">
            <div className="apple-card shadow-sm">
              <CollapsibleTrigger className="collapsible-trigger w-full p-6 cursor-pointer active:bg-muted/20 transition-colors rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h3 className="text-lg font-semibold text-foreground">Exercises</h3>
                      <p className="text-sm text-muted-foreground">Manage your exercises</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {exercisesLoading && (
                      <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                    )}
                    {exercisesLoaded && (
                      <span className="text-sm text-muted-foreground px-3 py-1 bg-muted/40 rounded-full">
                        {exercises.length}
                      </span>
                    )}
                    <ChevronRight className="collapsible-chevron h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="smooth-collapsible-content">
                <div className="collapsible-inner px-6 pb-6">
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={() => {
                        setEditingExercise(null);
                        setIsAddExerciseOpen(true);
                      }}
                      className="h-10 px-4 rounded-xl font-medium bg-primary active:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" /> 
                      Add Exercise
                    </Button>
                  </div>
                  
                  {exercisesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading exercises...</div>
                  ) : exercises.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exercises.map((exercise, index) => {
                        const category = categoriesLoaded ? categories.find(c => c.id === exercise.category_id) : null;
                        const categoryKey = category ? getCategoryKeyByName(category.name) : 'default';
                        const canDelete = deletableItems.exercises.has(exercise.id);
                        
                        return (
                          <div 
                            key={exercise.id} 
                            className={`apple-health-card settings-card-item group category-colored-card ${getCategoryClassName(categoryKey)}`}
                          >
                            {/* Top row: Exercise name + Actions */}
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="apple-health-card-title">
                                {exercise.name}
                              </h3>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon"
                                  onClick={() => handleEditExercise(exercise)}
                                  className="h-8 w-8 rounded-full bg-[#14b8a6] text-white shadow-md hover:bg-[#10b981] active:bg-[#0e9e6e] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon"
                                  onClick={() => handleDeleteExercise(exercise.id)}
                                  disabled={!canDelete}
                                  className={`h-8 w-8 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${!canDelete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={canDelete ? 'Delete exercise' : 'Cannot delete - used by other users'}
                                >
                                  <X className="h-4 w-4" />
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
                                <div className="w-3 h-3 rounded-full category-indicator-dot" />
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
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Logout Section */}
          <div 
            className="apple-card interactive p-6 shadow-sm cursor-pointer active:bg-red-50/20 dark:active:bg-red-950/10 transition-colors group"
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
              <ChevronRight className="h-5 w-5 text-muted-foreground group-active:text-red-600 dark:group-active:text-red-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Use shared dialog components */}
      <ExerciseDialog
        isOpen={isAddExerciseOpen}
        onOpenChange={setIsAddExerciseOpen}
        editingExercise={editingExercise}
        categories={categoriesLoaded ? categories : []}
        onSuccess={(exercise) => {
          // Refresh exercises
          fetchExercises();
          setEditingExercise(null);
        }}
      />
      
      <CategoryDialog
        isOpen={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
        editingCategory={editingCategory}
        categories={categoriesLoaded ? categories : []}
        onSuccess={(category) => {
          // Refresh categories
          fetchCategories();
          setEditingCategory(null);
        }}
      />
    </Layout>
  );
};

export default Settings;
