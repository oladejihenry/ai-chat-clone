import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "./user-avatar"
import { useAuth } from "@/hooks/use-auth"
import { User as UserIcon, ChevronDown, LogOut } from "lucide-react"

export function UserMenu() {
  const { user, logout, isLoggingOut } = useAuth()

  // Guard against null/undefined user or missing required properties
  if (!user || !user.data || !user.data.name || !user.data.email) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto hover:bg-green-100/70 dark:hover:bg-slate-800/70 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <UserAvatar user={user} className="h-9 w-9" />
            <span className="text-sm font-semibold text-green-900 dark:text-white truncate">
              {user.data.name}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-green-600/70 dark:text-green-400/70 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-white dark:bg-slate-900 border-green-200/50 dark:border-slate-700/50 shadow-xl"
        sideOffset={2}
      >
        <DropdownMenuItem className="text-green-800 dark:text-white hover:bg-green-50 dark:hover:bg-slate-800/50 cursor-pointer py-2.5">
          <UserIcon className="mr-3 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-green-100 dark:bg-slate-700/50 my-1" />
        
        <DropdownMenuItem
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20 py-2.5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 