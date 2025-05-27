import React, { useState, useEffect } from 'react';
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
        {/* Profile Hero Section */}
        <div className="relative">
          {/* Background blur effect */}
          <div className="absolute inset-0 rounded-3xl opacity-20 blur-xl bg-blue-500" />
          
          {/* Profile container */}
          <div className="relative backdrop-blur-sm bg-card/80 rounded-3xl border shadow-lg p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-white/20">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-semibold">
                  {profile.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                  >
                    <Edit2 className="h-5 w-5 text-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                        <Input
                          id="name"
                          value={profileForm.watch('name')}
                          onChange={(e) => profileForm.setValue('name', e.target.value)}
                          className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                        <Input
                          id="username"
                          value={profileForm.watch('username')}
                          onChange={(e) => profileForm.setValue('username', e.target.value)}
                          className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl" className="text-sm font-medium text-gray-700">Avatar URL</Label>
                        <Input
                          id="avatarUrl"
                          value={profileForm.watch('avatarUrl')}
                          onChange={(e) => profileForm.setValue('avatarUrl', e.target.value)}
                          className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                          placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=YourName"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="w-full h-12 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 shadow-lg transition-all duration-200 hover:shadow-xl"
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Theme Settings */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl opacity-10 blur-lg bg-purple-500" />
            <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl border border-gray-200/30 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-600"
                >
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
                  <p className="text-sm text-gray-500">Customize your app theme</p>
                </div>
              </div>
              <ThemeSelector />
            </div>
          </div>

          {/* Categories Management */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl opacity-10 blur-lg bg-green-500" />
            <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl border border-gray-200/30 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600"
                  >
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                    <p className="text-sm text-gray-500">Manage exercise categories</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setEditingCategory(null);
                    categoryForm.reset({ name: '', description: '' });
                    setIsAddCategoryOpen(true);
                  }}
                  className="h-10 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-6 text-gray-500">Loading categories...</div>
              ) : categories.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-gray-200/40">
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-500">{category.description || 'No description'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="h-8 w-8 rounded-lg hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No categories found. Create your first category!
                </div>
              )}
            </div>
          </div>

          {/* Exercises Management */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl opacity-10 blur-lg bg-orange-500" />
            <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl border border-gray-200/30 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600"
                  >
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Exercises</h3>
                    <p className="text-sm text-gray-500">Manage your exercises</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setEditingExercise(null);
                    exerciseForm.reset({ name: '', description: '', categoryId: '' });
                    setIsAddExerciseOpen(true);
                  }}
                  className="h-10 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-6 text-gray-500">Loading exercises...</div>
              ) : exercises.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {exercises.map(exercise => {
                    const category = categories.find(c => c.id === exercise.category_id);
                    return (
                      <div key={exercise.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-gray-200/40">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                          <p className="text-sm text-gray-500">{exercise.description || 'No description'}</p>
                          <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md">
                            {category?.name || 'Uncategorized'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No exercises found. Create your first exercise!
                </div>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl opacity-10 blur-lg bg-red-500" />
            <div 
              className="relative backdrop-blur-sm bg-white/90 rounded-2xl border border-gray-200/30 p-6 shadow-sm cursor-pointer hover:bg-red-50/50 transition-colors"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Sign Out</h3>
                  <p className="text-sm text-gray-500">Sign out of your account</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals for editing exercises and categories */}
      <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
        <DialogContent className="rounded-2xl">
          <form onSubmit={exerciseForm.handleSubmit(handleAddExercise)}>
            <DialogHeader>
              <DialogTitle>{editingExercise ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
              <DialogDescription>
                {editingExercise 
                  ? 'Update the exercise details below' 
                  : 'Add a new exercise to track your progress'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="name"
                  value={exerciseForm.watch('name')}
                  onChange={(e) => exerciseForm.setValue('name', e.target.value)}
                  className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                  placeholder="Bench Press"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Input
                  id="description"
                  value={exerciseForm.watch('description')}
                  onChange={(e) => exerciseForm.setValue('description', e.target.value)}
                  className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                  placeholder="Barbell bench press"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                <select
                  id="category"
                  title="Select exercise category"
                  value={exerciseForm.watch('categoryId')}
                  onChange={(e) => exerciseForm.setValue('categoryId', e.target.value)}
                  className="w-full p-2.5 border border-gray-200/60 rounded-xl text-sm focus:outline-none bg-white/80 text-gray-900"
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
                className="w-full h-12 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                {editingExercise ? 'Update Exercise' : 'Add Exercise'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="rounded-2xl">
          <form onSubmit={categoryForm.handleSubmit(handleAddCategory)}>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Update the category details below' 
                  : 'Create a new category for organizing exercises'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="name"
                  value={categoryForm.watch('name')}
                  onChange={(e) => categoryForm.setValue('name', e.target.value)}
                  className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                  placeholder="Chest"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Input
                  id="description"
                  value={categoryForm.watch('description')}
                  onChange={(e) => categoryForm.setValue('description', e.target.value)}
                  className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0"
                  placeholder="Chest exercises"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 shadow-lg transition-all duration-200 hover:shadow-xl"
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
