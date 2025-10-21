"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"

// Core Radix UI exports
export const ToastProvider = ToastPrimitive.Provider
export const ToastViewport = ToastPrimitive.Viewport

// Root toast container
export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={`bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-lg border border-neutral-700 transition-all ${className}`}
    {...props}
  />
))
Toast.displayName = "Toast"

// Title
export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={`font-semibold text-sm ${className}`}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

// Description
export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={`text-xs opacity-80 ${className}`}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

// Close button
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={`ml-2 text-white/70 hover:text-white text-sm ${className}`}
    {...props}
  >
    ✕
  </ToastPrimitive.Close>
))
ToastClose.displayName = "ToastClose"

// Action (optional)
export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={`text-blue-400 hover:text-blue-300 underline text-xs ${className}`}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

// Viewport
export const ToastContainer = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={`fixed bottom-4 right-4 flex flex-col gap-2 z-[100] ${className}`}
    {...props}
  />
))
ToastContainer.displayName = "ToastContainer"
