import { toast } from './toast-utils'

// Mobile-specific toast utilities
export const mobileToast = {
  // For critical actions that need immediate feedback
  critical: (title: string, description?: string) => {
    return toast.error({
      title,
      description,
      duration: 8000, // Longer duration for critical messages
    })
  },

  // For success actions that can be queued
  success: (title: string, description?: string) => {
    return toast.successQueued({
      title,
      description,
      duration: 3000, // Shorter duration for success messages
    })
  },

  // For informational messages
  info: (title: string, description?: string) => {
    return toast.info({
      title,
      description,
      duration: 4000,
    })
  },

  // Specialized mobile-friendly messages
  exerciseLogged: (exerciseName?: string) => {
    return toast.successQueued({
      title: exerciseName ? `${exerciseName} logged! 💪` : "Logged! 💪",
      description: "Progress recorded",
    })
  },

  exerciseAdded: (exerciseName?: string) => {
    return toast.successQueued({
      title: "Added! ✅",
      description: exerciseName ? `${exerciseName} added to library` : "Exercise added to library",
    })
  },

  categoryCreated: (categoryName?: string) => {
    return toast.successQueued({
      title: "Created! 📁",
      description: categoryName ? `${categoryName} category ready` : "Category created",
    })
  },

  loginSuccess: () => {
    return toast.success({
      title: "Welcome back! 👋",
      description: "You're all set",
    })
  },

  logoutSuccess: () => {
    return toast.info({
      title: "See you later! 👋",
      description: "Successfully signed out",
    })
  },

  networkError: () => {
    return toast.error({
      title: "Connection lost 📡",
      description: "Check your internet and try again",
    })
  },

  genericError: (message?: string) => {
    return toast.error({
      title: "Oops! 😅",
      description: message || "Something went wrong. Try again.",
    })
  },

  // For actions that might be repeated quickly
  quickSuccess: (title: string) => {
    return toast.successQueued({
      title,
      duration: 2000, // Very short for quick feedback
    })
  },
}

// Utility to check if we're on a mobile device
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
}

// Utility to check if we're on iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Utility to check if we're on Android
export const isAndroid = () => {
  return /Android/.test(navigator.userAgent)
} 