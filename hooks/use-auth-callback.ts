"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'


export function useAuthCallback() {
  const { refetchUser, user, isAuthenticated } = useAuth()
  const hasShownWelcome = useRef(false)


  // Show welcome toast when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && !hasShownWelcome.current) {
      // toast.success(`Welcome back, ${user?.data.name}!`)
      hasShownWelcome.current = true
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    // Check if we're coming back from an OAuth flow
    const urlParams = new URLSearchParams(window.location.search)
    const hasOAuthParams = urlParams.has('code') || urlParams.has('state')
    
    // Also check if we just loaded the page and might have new session cookies
    const shouldRefresh = hasOAuthParams || !document.referrer || document.referrer.includes('google.com')
    
    if (shouldRefresh) {
      // Small delay to ensure cookies are set
      const timer = setTimeout(() => {
        refetchUser()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [refetchUser])
} 