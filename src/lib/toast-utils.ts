import { toast as baseToast } from "@/hooks/use-toast";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

// Toast queue management for mobile optimization
const toastQueue: Array<() => void> = [];
let isProcessingQueue = false;

const processToastQueue = () => {
  if (isProcessingQueue || toastQueue.length === 0) return;

  isProcessingQueue = true;
  const showToast = toastQueue.shift();

  if (showToast) {
    showToast();
    // Wait a bit before showing next toast to prevent overwhelming
    setTimeout(() => {
      isProcessingQueue = false;
      processToastQueue();
    }, 500);
  } else {
    isProcessingQueue = false;
  }
};

const queueToast = (toastFunction: () => void) => {
  toastQueue.push(toastFunction);
  processToastQueue();
};

export const toast = {
  success: ({ title, description, duration = 4000 }: ToastOptions) => {
    return baseToast({
      title,
      description,
      variant: "success" as "default" | "destructive" | "success",
      duration,
    });
  },

  error: ({ title, description, duration = 6000 }: ToastOptions) => {
    return baseToast({
      title,
      description,
      variant: "destructive",
      duration,
    });
  },

  info: ({ title, description, duration = 4000 }: ToastOptions) => {
    return baseToast({
      title,
      description,
      variant: "default",
      duration,
    });
  },

  // Mobile-optimized versions with queuing
  successQueued: ({ title, description, duration = 4000 }: ToastOptions) => {
    queueToast(() =>
      baseToast({
        title,
        description,
        variant: "success" as "default" | "destructive" | "success",
        duration,
      }),
    );
  },

  errorQueued: ({ title, description, duration = 6000 }: ToastOptions) => {
    // Errors are always shown immediately, not queued
    return baseToast({
      title,
      description,
      variant: "destructive",
      duration,
    });
  },

  // Convenient methods for common app actions
  exerciseLogged: (exerciseName?: string) => {
    return toast.successQueued({
      title: exerciseName
        ? `${exerciseName} logged! 💪`
        : "Exercise logged! 💪",
      description: "Your progress has been recorded successfully.",
    });
  },

  exerciseAdded: (exerciseName?: string) => {
    return toast.successQueued({
      title: "Exercise added!",
      description: exerciseName
        ? `${exerciseName} has been added to your library.`
        : "Your new exercise has been added successfully.",
    });
  },

  categoryAdded: (categoryName?: string) => {
    return toast.successQueued({
      title: "Category created!",
      description: categoryName
        ? `${categoryName} has been added to your categories.`
        : "Your new category has been created successfully.",
    });
  },

  loginSuccess: () => {
    return toast.success({
      title: "Welcome back! 👋",
      description: "You've successfully signed in.",
    });
  },

  logoutSuccess: () => {
    return toast.info({
      title: "See you later! 👋",
      description: "You've been signed out successfully.",
    });
  },

  networkError: () => {
    return toast.error({
      title: "Connection issue",
      description: "Please check your internet connection and try again.",
    });
  },

  genericError: (message?: string) => {
    return toast.error({
      title: "Something went wrong",
      description: message || "Please try again.",
    });
  },
};
