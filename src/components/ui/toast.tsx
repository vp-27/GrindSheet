import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl p-4 pr-10 transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full duration-300 ease-out backdrop-filter backdrop-blur-md -webkit-backdrop-filter",
  {
    variants: {
      variant: {
        default: "bg-white/85 dark:bg-[rgba(28,28,30,0.85)] text-foreground border border-white/30 dark:border-none shadow-lg shadow-black/8",
        destructive:
          "destructive group bg-gradient-to-r from-red-50 via-red-50 to-red-100 dark:from-red-950/30 dark:via-red-950/30 dark:to-red-900/30 text-red-900 dark:text-red-100 border border-red-200/50 dark:border-red-800/50 shadow-lg shadow-red-500/10",
        success:
          "bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:via-emerald-950/30 dark:to-emerald-950/30 text-emerald-900 dark:text-emerald-100 border border-emerald-200/50 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-white/30 dark:border-gray-700/30 bg-white/85 dark:bg-gray-800/85 px-3 text-sm font-medium backdrop-filter backdrop-blur-md transition-all hover:bg-white/95 dark:hover:bg-gray-700/95 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-300/40 group-[.destructive]:hover:border-red-300/60 group-[.destructive]:hover:bg-red-100/90 dark:group-[.destructive]:hover:bg-red-900/90 group-[.destructive]:text-red-800 dark:group-[.destructive]:text-red-200",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-full p-1.5 text-foreground/60 opacity-70 transition-all hover:text-foreground hover:opacity-100 hover:bg-white/50 dark:hover:bg-gray-700/50 active:scale-95 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 group-hover:opacity-100 group-[.destructive]:text-red-600 dark:group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-700 dark:group-[.destructive]:hover:text-red-300 group-[.destructive]:hover:bg-red-100/60 dark:group-[.destructive]:hover:bg-red-900/60",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 leading-relaxed", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

// Add support for success variant
declare module "@radix-ui/react-toast" {
  interface ToastProps {
    variant?: "default" | "destructive" | "success"
  }
}

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
