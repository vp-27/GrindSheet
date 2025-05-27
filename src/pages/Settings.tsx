import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { ChevronRight, Edit2, Plus, Settings as SettingsIcon, Trash2, User, Pencil, LogOut, Folder, Palette, Dumbbell } from 'lucide-react';
import ThemeSelector from '@/components/ThemeSelector';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';

const Settings: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
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
        {/* Profile Section - Clean Apple-style blend */}
        <div className="py-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">
                {profile.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">{profile.name}</h1>
              <p className="text-lg text-muted-foreground">@{profile.username}</p>
            </div>
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-muted transition-colors h-12 w-12"
                >
                  <Edit2 className="h-6 w-6 text-muted-foreground" />
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
                      className="w-full h-12 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                      style={{ 
                        backgroundColor: '#3b82f6',
                        boxShadow: '0 4px 20px #3b82f630'
                      }}
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
        <div className="space-y-4">
          {/* Theme Settings */}
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
              style={{ backgroundColor: '#8b5cf6' }}
            />
            <div className="relative backdrop-blur-sm bg-card/90 rounded-2xl border border-border/30 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                  style={{ 
                    backgroundColor: '#8b5cf615',
                    color: '#8b5cf6'
                  }}
                >
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                  <p className="text-sm text-muted-foreground">Customize your app theme</p>
                </div>
              </div>
              <ThemeSelector />
            </div>
          </div>

          {/* Categories Management */}
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
              style={{ backgroundColor: '#10b981' }}
            />
            <div className="relative backdrop-blur-sm bg-card/90 rounded-2xl border border-border/30 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{ 
                      backgroundColor: '#10b98115',
                      color: '#10b981'
                    }}
                  >
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Categories</h3>
                    <p className="text-sm text-muted-foreground">Manage exercise categories</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setEditingCategory(null);
                    categoryForm.reset({ name: '', description: '' });
                    setIsAddCategoryOpen(true);
                  }}
                  className="h-10 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#10b981',
                    boxShadow: '0 4px 20px #10b98130'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">Loading categories...</div>
              ) : categories.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {categories.map(category => {
                    const categoryKey = getCategoryKeyByName(category.name);
                    const colors = getCategoryColors(categoryKey);
                    
                    return (
                      <div 
                        key={category.id} 
                        className="flex items-center justify-between p-3 rounded-xl border backdrop-blur-sm"
                        style={{
                          backgroundColor: `${colors.primary}10`,
                          borderColor: `${colors.primary}20`
                        }}
                      >
                        <div>
                          <h4 className="font-medium text-foreground">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">{category.description || 'No description'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-8 w-8 rounded-lg hover:bg-background/60"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No categories found. Create your first category!
                </div>
              )}
            </div>
          </div>

          {/* Exercises Management */}
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
              style={{ backgroundColor: '#f59e0b' }}
            />
            <div className="relative backdrop-blur-sm bg-card/90 rounded-2xl border border-border/30 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{ 
                      backgroundColor: '#f59e0b15',
                      color: '#f59e0b'
                    }}
                  >
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Exercises</h3>
                    <p className="text-sm text-muted-foreground">Manage your exercises</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setEditingExercise(null);
                    exerciseForm.reset({ name: '', description: '', categoryId: '' });
                    setIsAddExerciseOpen(true);
                  }}
                  className="h-10 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#f59e0b',
                    boxShadow: '0 4px 20px #f59e0b30'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">Loading exercises...</div>
              ) : exercises.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {exercises.map(exercise => {
                    const category = categories.find(c => c.id === exercise.category_id);
                    const categoryKey = category ? getCategoryKeyByName(category.name) : 'default';
                    const colors = getCategoryColors(categoryKey);
                    
                    return (
                      <div 
                        key={exercise.id} 
                        className="flex items-center justify-between p-3 rounded-xl border backdrop-blur-sm"
                        style={{
                          backgroundColor: `${colors.primary}10`,
                          borderColor: `${colors.primary}20`
                        }}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{exercise.name}</h4>
                          <p className="text-sm text-muted-foreground">{exercise.description || 'No description'}</p>
                          <span 
                            className="inline-block mt-1 text-xs px-2 py-1 rounded-md font-medium"
                            style={{
                              backgroundColor: `${colors.primary}15`,
                              color: colors.primary
                            }}
                          >
                            {category?.name || 'Uncategorized'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                            className="h-8 w-8 rounded-lg hover:bg-background/60"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No exercises found. Create your first exercise!
                </div>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
              style={{ backgroundColor: '#ef4444' }}
            />
            <div 
              className="relative backdrop-blur-sm bg-card/90 rounded-2xl border border-border/30 p-6 shadow-sm cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                  style={{ 
                    backgroundColor: '#ef444415',
                    color: '#ef4444'
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Sign Out</h3>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals for editing exercises and categories */}
      <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
        <DialogContent className="rounded-2xl backdrop-blur-sm bg-card/95 border-border/50">
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
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
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
                  className="w-full p-2.5 border border-border/60 rounded-xl text-sm focus:outline-none bg-background/80 text-foreground"
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
                className="w-full h-12 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                style={{ 
                  backgroundColor: '#f59e0b',
                  boxShadow: '0 4px 20px #f59e0b30'
                }}
              >
                {editingExercise ? 'Update Exercise' : 'Add Exercise'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="rounded-2xl backdrop-blur-sm bg-card/95 border-border/50">
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
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
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
                className="w-full h-12 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                style={{ 
                  backgroundColor: '#10b981',
                  boxShadow: '0 4px 20px #10b98130'
                }}
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
