
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { calculateProgress } from '@/utils/progressUtils';

const formSchema = z.object({
  exerciseId: z.string().min(1, { message: 'Please select an exercise' }),
  weight: z.coerce
    .number()
    .positive({ message: 'Weight must be a positive number' }),
  note: z.string().optional(),
});

const AddExercise: React.FC = () => {
  const {
    currentUser,
    categories,
    exercises,
    exerciseLogs,
    addExerciseLog,
    selectedCategory,
    selectedExercise,
    setSelectedExercise,
    setSelectedCategory,
  } = useAppContext();
  
  const navigate = useNavigate();
  const [filteredExercises, setFilteredExercises] = useState(exercises);
  
  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exerciseId: selectedExercise?.id || '',
      weight: '',
      note: '',
    },
  });
  
  // Filter exercises when category changes
  useEffect(() => {
    if (selectedCategory) {
      setFilteredExercises(exercises.filter(e => e.categoryId === selectedCategory.id));
    } else {
      setFilteredExercises(exercises);
    }
  }, [selectedCategory, exercises]);
  
  // Set form value when selected exercise changes
  useEffect(() => {
    if (selectedExercise) {
      form.setValue('exerciseId', selectedExercise.id);
      
      // Try to pre-fill the weight with the user's last entry for this exercise
      const lastLog = exerciseLogs
        .filter(log => log.userId === currentUser.id && log.exerciseId === selectedExercise.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (lastLog) {
        form.setValue('weight', lastLog.weight);
      }
    }
  }, [selectedExercise, form, currentUser.id, exerciseLogs]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Add the exercise log
    addExerciseLog({
      userId: currentUser.id,
      exerciseId: values.exerciseId,
      weight: values.weight,
      note: values.note,
    });
    
    // Calculate if this is a PR
    const exercise = exercises.find(e => e.id === values.exerciseId);
    if (exercise) {
      const userLogs = exerciseLogs.filter(log => 
        log.userId === currentUser.id && log.exerciseId === values.exerciseId
      );
      const progress = calculateProgress(userLogs, values.exerciseId, exercise);
      
      if (values.weight > (progress.personalRecord || 0)) {
        toast.success('New personal record! 🎉', {
          description: `You just set a new PR for ${exercise.name}!`,
        });
      } else {
        toast.success('Exercise logged!');
      }
    }
    
    // Reset form and navigate back to dashboard
    form.reset();
    setSelectedExercise(null);
    navigate('/');
  };
  
  const handleSelectCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
  };
  
  const handleSelectExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    setSelectedExercise(exercise || null);
  };
  
  return (
    <Layout title="Log Exercise">
      <div className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="exerciseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSelectExercise(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <React.Fragment key={category.id}>
                          <SelectItem
                            value={`category-${category.id}`}
                            className="font-semibold bg-muted"
                            onSelect={() => handleSelectCategory(category.id)}
                            disabled
                          >
                            {category.name}
                          </SelectItem>
                          {exercises
                            .filter((ex) => ex.categoryId === category.id)
                            .map((exercise) => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.name}
                              </SelectItem>
                            ))}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter weight"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How did it feel? Any achievements?"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any comments about this set or your performance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Log Exercise
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default AddExercise;
