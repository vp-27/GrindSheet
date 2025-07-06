import { toast as baseToast } from "@/hooks/use-toast"

interface ToastOptions {
  title: string
  description?: string
  duration?: number
}

export const toast = {
  success: ({ title, description, duration = 4000 }: ToastOptions) => {
    return baseToast({
      title,
      description,
      variant: "success" as "default" | "destructive" | "success",
      duration,
    })
  },

  error: ({ title, description, duration = 6000 }: ToastOptions) => {
    return baseToast({
      title,
      description,
      variant: "destructive",
      duration,
    })
  },

  info: ({ title, description, duration = 4000 }: ToastOptions) => {
    return baseToast({
      title,
      description,
      variant: "default",
      duration,
    })
  },

  // Convenient methods for common app actions
  exerciseLogged: (exerciseName?: string) => {
    return toast.success({
      title: exerciseName ? `${exerciseName} logged! 💪` : "Exercise logged! 💪",
      description: "Your progress has been recorded successfully.",
    })
  },

  exerciseAdded: (exerciseName?: string) => {
    return toast.success({
      title: "Exercise added!",
      description: exerciseName 
        ? `${exerciseName} has been added to your library.`
        : "Your new exercise has been added successfully.",
    })
  },

  categoryAdded: (categoryName?: string) => {
    return toast.success({
      title: "Category created!",
      description: categoryName
        ? `${categoryName} has been added to your categories.`
        : "Your new category has been created successfully.",
    })
  },

  loginSuccess: () => {
    return toast.success({
      title: "Welcome back! 👋",
      description: "You've successfully signed in.",
    })
  },

  logoutSuccess: () => {
    return toast.info({
      title: "See you later! 👋",
      description: "You've been signed out successfully.",
    })
  },

  networkError: () => {
    return toast.error({
      title: "Connection issue",
      description: "Please check your internet connection and try again.",
    })
  },

  genericError: (message?: string) => {
    return toast.error({
      title: "Something went wrong",
      description: message || "Please try again.",
    })
  },
}
