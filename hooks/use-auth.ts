import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getCurrentUser, logoutUser, type User } from '@/lib/api'
import { toast } from 'sonner'

export function useAuth() {
  const queryClient = useQueryClient()

  // Query to get current user
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation for logout
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onMutate: () => {
      // Optimistically clear user data immediately when logout starts
      queryClient.setQueryData(['auth', 'user'], null)
    },
    onSuccess: () => {
      // Ensure user data is cleared
      queryClient.setQueryData(['auth', 'user'], null)
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
      toast.success('Logged out successfully')
    },
    onError: (error) => {
      console.error('Logout failed:', error)
      toast.error('Failed to logout. Please try again.')
      // On error, refetch user data to restore state
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
    },
  })

  // Function to manually refetch user data (useful after login)
  const refetchUser = () => {
    return queryClient.invalidateQueries({
      queryKey: ['auth', 'user'],
    })
  }

  return {
    user: user as User | null,
    isAuthenticated: !!user && !!user?.data,
    isLoading,
    error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    refetchUser,
  }
} 