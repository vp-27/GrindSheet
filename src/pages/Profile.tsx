
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const Profile: React.FC = () => {
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
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .eq('user_id', user.id)
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
        // Insert new category
        response = await supabase
          .from('categories')
          .insert({
            user_id: user?.id,
            name: data.name,
            description: data.description,
          })
          .select();
      }
      
      if (response.error) throw response.error;
      
      // Refresh categories
      const { data: refreshedCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
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
      
      // Refresh exercises
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user?.id)
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
      
      // Refresh categories
      const { data: refreshedCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
        
      setCategories(refreshedCategories || []);
      
      // Also refresh exercises as some might have been deleted
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user?.id)
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
      
      // Refresh exercises
      const { data: refreshedExercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user?.id)
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
      <Layout title="Profile">
        <div className="flex justify-center items-center h-64">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile">
      <div className="flex flex-col gap-6 pb-16">
        <div className="flex flex-col items-center gap-4 mt-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url} alt={profile.name} />
            <AvatarFallback className="text-2xl">
              {profile.name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <div className="text-muted-foreground">@{profile.username}</div>
          
          <div className="flex gap-4">
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={profileForm.watch('name')}
                        onChange={(e) => profileForm.setValue('name', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={profileForm.watch('username')}
                        onChange={(e) => profileForm.setValue('username', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="avatarUrl" className="text-right">
                        Avatar URL
                      </Label>
                      <Input
                        id="avatarUrl"
                        value={profileForm.watch('avatarUrl')}
                        onChange={(e) => profileForm.setValue('avatarUrl', e.target.value)}
                        className="col-span-3"
                        placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=YourName"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleLogout}>Log Out</Button>
          </div>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <section>
              <h2 className="font-semibold text-lg mb-2">About the App</h2>
              <p className="text-muted-foreground text-sm mb-6">
                FitTrack helps you and your friends track strength training progress, compete on leaderboards, 
                and visualize gains across different exercises. Simply log your latest weight for each exercise 
                and let the app handle all the stats, history, and rankings.
              </p>
            </section>
          </TabsContent>
          
          <TabsContent value="exercises">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Manage Exercises</h2>
                <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Add Exercise</Button>
                  </DialogTrigger>
                  <DialogContent>
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
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={exerciseForm.watch('name')}
                            onChange={(e) => exerciseForm.setValue('name', e.target.value)}
                            className="col-span-3"
                            placeholder="Bench Press"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">
                            Description
                          </Label>
                          <Input
                            id="description"
                            value={exerciseForm.watch('description')}
                            onChange={(e) => exerciseForm.setValue('description', e.target.value)}
                            className="col-span-3"
                            placeholder="Barbell bench press"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">
                            Category
                          </Label>
                          <select
                            id="category"
                            value={exerciseForm.watch('categoryId')}
                            onChange={(e) => exerciseForm.setValue('categoryId', e.target.value)}
                            className="col-span-3 p-2 border rounded"
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
                        <Button type="submit">
                          {editingExercise ? 'Update Exercise' : 'Add Exercise'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loading ? (
                <p>Loading exercises...</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {categories.map(category => {
                    const categoryExercises = exercises.filter(
                      exercise => exercise.category_id === category.id
                    );
                    
                    if (categoryExercises.length === 0) return null;
                    
                    return (
                      <Card key={category.id} className="overflow-hidden">
                        <CardHeader className="bg-muted pb-2">
                          <CardTitle className="text-md">{category.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {categoryExercises.map(exercise => (
                            <div key={exercise.id} className="p-3 border-b last:border-0 flex justify-between items-center">
                              <div>
                                <div className="font-medium">{exercise.name}</div>
                                {exercise.description && (
                                  <div className="text-xs text-muted-foreground">{exercise.description}</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleEditExercise(exercise)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-500"
                                  onClick={() => handleDeleteExercise(exercise.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {exercises.length === 0 && (
                    <div className="text-center p-8 border rounded">
                      <p>No exercises found. Add your first exercise!</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </TabsContent>
          
          <TabsContent value="categories">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Manage Categories</h2>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Add Category</Button>
                  </DialogTrigger>
                  <DialogContent>
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
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={categoryForm.watch('name')}
                            onChange={(e) => categoryForm.setValue('name', e.target.value)}
                            className="col-span-3"
                            placeholder="Chest"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">
                            Description
                          </Label>
                          <Input
                            id="description"
                            value={categoryForm.watch('description')}
                            onChange={(e) => categoryForm.setValue('description', e.target.value)}
                            className="col-span-3"
                            placeholder="Chest exercises"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">
                          {editingCategory ? 'Update Category' : 'Add Category'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loading ? (
                <p>Loading categories...</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {categories.map(category => (
                    <Card key={category.id} className="overflow-hidden">
                      <CardContent className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-muted-foreground">{category.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditCategory(category)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="text-center p-8 border rounded">
                      <p>No categories found. Add your first category!</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
