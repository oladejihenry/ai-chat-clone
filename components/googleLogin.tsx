import { FcGoogle } from "react-icons/fc";
import { Button } from "./ui/button";

export function GoogleLogin() {
    const googleLoginUrl = process.env.NEXT_PUBLIC_API_URL + '/auth/google/url'
    
    const handleGoogleLogin = () => {
        window.location.href = googleLoginUrl
    }
    
    return (
        <Button 
            onClick={handleGoogleLogin}
            className="w-full mt-4" 
            variant="outline"
        >
            <FcGoogle className="w-4 h-4 mr-2" />
            Login with Google
        </Button>
    )
}