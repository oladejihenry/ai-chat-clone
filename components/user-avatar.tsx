import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type User } from "@/lib/api"

interface UserAvatarProps {
  user: User | null
  className?: string
}

export function UserAvatar({ user, className = "h-8 w-8" }: UserAvatarProps) {
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '??'
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Guard against null/undefined user
  if (!user || !user.data || !user.data.name) {
    return (
      <Avatar className={className}>
        <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
          ??
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.data.avatar} alt={user?.data.name} />
      <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
        {getInitials(user.data.name)}
      </AvatarFallback>
    </Avatar>
  )
} 