import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Metadata } from "next"
import { Mail } from "lucide-react"
import { GoogleIcon, GitHubIcon } from "@/components/ui/icons"

export const metadata: Metadata = {
  title: "Sign In - MyBoard",
  description: "Sign in to your MyBoard account",
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Choose your preferred sign-in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async (formData) => {
              "use server"
              const email = formData.get("email") as string
              await signIn("resend", { email, redirectTo: "/" })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Sign in with Email
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/" })
            }}
          >
            <Button 
              type="submit"
              variant="outline" 
              className="w-full"
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </form>

          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/" })
            }}
          >
            <Button 
              type="submit"
              variant="outline" 
              className="w-full"
            >
              <GitHubIcon className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Secure authentication
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our terms and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}