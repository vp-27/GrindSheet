import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDialog, ExerciseDialog } from "@/components/ui/shared-dialogs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/useAppContext";
import { useToast } from "@/hooks/use-toast";
import type { Row } from "@/lib/app-data";
import { mobileToast } from "@/lib/mobile-toast-utils";
import { cn } from "@/lib/utils";
import {
  getCategoryColors,
  getCategoryKeyByName,
} from "@/utils/categoryColors";
import { Plus } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface AddExerciseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedExerciseId?: string;
  preselectedCategoryId?: string;
}

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onOpenChange,
  preselectedExerciseId,
  preselectedCategoryId,
}) => {
  const { categories, exercises, addExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSelectedCategoryId("");
      setSelectedExerciseId("");
      setWeight("");
      setNote("");
    } else {
      setSelectedCategoryId(preselectedCategoryId || "");
      setSelectedExerciseId(""); // Set exercise after category
    }
  }, [isOpen, preselectedCategoryId]);

  // When category changes and preselectedExerciseId is provided, set exercise if it matches
  useEffect(() => {
    if (
      isOpen &&
      preselectedExerciseId &&
      selectedCategoryId &&
      localExercises.some(
        (e) =>
          e.id === preselectedExerciseId && e.categoryId === selectedCategoryId,
      )
    ) {
      setSelectedExerciseId(preselectedExerciseId);
    }
  }, [isOpen, preselectedExerciseId, selectedCategoryId, localExercises]);

  // Filter exercises based on selected category
  const filteredExercises = localExercises.filter(
    (exercise) => exercise.categoryId === selectedCategoryId,
  );

  // Get selected category for styling
  const selectedCategory = localCategories.find(
    (cat) => cat.id === selectedCategoryId,
  );
  const categoryColors = useMemo(() => {
    if (!selectedCategory) return null;
    const categoryKey = getCategoryKeyByName(selectedCategory.name);
    return getCategoryColors(categoryKey);
  }, [selectedCategory]);

  // Handlers for adding new categories/exercises
  const handleCategoryAdded = (newCategory: Row<"categories">) => {
    setLocalCategories((prev) => [...prev, newCategory]);
    setSelectedCategoryId(newCategory.id);
    setSelectedExerciseId("");
    setIsAddCategoryOpen(false);
  };

  const handleExerciseAdded = (newExercise: Row<"exercises">) => {
    const exerciseWithCategoryId = {
      ...newExercise,
      categoryId: newExercise.category_id,
    };
    setLocalExercises((prev) => [...prev, exerciseWithCategoryId]);
    setSelectedExerciseId(newExercise.id);
    setIsAddExerciseOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedExerciseId || !weight) {
      mobileToast.critical(
        "Missing information",
        "Please select an exercise and enter the weight.",
      );
      return;
    }

    const weightValue = parseFloat(weight);
    if (!Number.isFinite(weightValue) || weightValue < 0) {
      mobileToast.critical(
        "Invalid weight",
        "Please enter a valid weight value (0 for bodyweight exercises).",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await addExerciseLog({
        userId: profile?.id || "",
        exerciseId: selectedExerciseId,
        weight: weightValue,
        note: note,
        weightUnit: "lbs",
      });

      mobileToast.exerciseLogged();

      onOpenChange(false);
    } catch (error) {
      mobileToast.genericError(
        error instanceof Error
          ? error.message
          : "Failed to log exercise. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="exercise-sheet"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("log-exercise-heading")?.focus();
          }}
        >
          {/* Handle bar for visual feedback and swipe area */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1 bg-muted-foreground/30 dark:bg-white/40 rounded-full" />
          </div>

          {/* Modal header */}
          <div className="px-6 pb-4">
            <DialogTitle
              className="text-xl font-bold"
              id="log-exercise-heading"
              tabIndex={-1}
            >
              Log exercise
            </DialogTitle>
            <DialogDescription>
              Track the weight you lifted and add an optional note.
            </DialogDescription>
          </div>

          {/* Modal form content */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCategoryId}
                  onValueChange={(id) => {
                    setSelectedCategoryId(id);
                    setSelectedExerciseId("");
                  }}
                >
                  <SelectTrigger
                    id="category"
                    className="flex-1 rounded-lg border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] focus:border-primary focus:ring-0 h-10 text-sm shadow-sm"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="apple-card border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] backdrop-blur-md shadow-md">
                    {localCategories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="rounded-lg"
                      >
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
                  <SelectTrigger
                    id="exercise"
                    className="flex-1 rounded-lg border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] focus:border-primary focus:ring-0 h-10 text-sm shadow-sm"
                  >
                    <SelectValue
                      placeholder={
                        selectedCategoryId
                          ? "Select exercise"
                          : "Category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="apple-card border border-[rgba(200,200,200,0.7)] dark:border-[rgba(80,80,80,0.7)] bg-white dark:bg-[#1c1c1e] backdrop-blur-md shadow-md">
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map((exercise) => (
                        <SelectItem
                          key={exercise.id}
                          value={exercise.id}
                          className="rounded-lg"
                        >
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
                      : "shadow-lg active:scale-95",
                  )}
                  style={
                    selectedCategoryId && categoryColors
                      ? {
                          backgroundColor: categoryColors.primary,
                          boxShadow: `0 8px 16px -4px ${categoryColors.primary}40, 0 4px 8px -2px ${categoryColors.primary}30`,
                          color: "white",
                        }
                      : undefined
                  }
                >
                  <Plus
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      selectedCategoryId ? "group-active:scale-110" : "",
                    )}
                  />
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
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numeric input (including decimals)
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setWeight(value);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent non-numeric characters except for allowed keys
                  if (
                    !/[0-9.]/.test(e.key) &&
                    ![
                      "Backspace",
                      "Delete",
                      "Tab",
                      "Escape",
                      "Enter",
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(e.key)
                  ) {
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
                style={
                  categoryColors
                    ? {
                        backgroundColor: categoryColors.primary,
                        borderColor: categoryColors.primary,
                      }
                    : undefined
                }
              >
                {isSubmitting ? "Logging..." : "Log Exercise"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
