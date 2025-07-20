"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Share2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareButtonProps {
  boardId: string
  isPublic: boolean
  shareId: string | null
  onTogglePublic: (isPublic: boolean) => void
}

export function ShareButton({ boardId, isPublic, shareId, onTogglePublic }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState("")
  
  useEffect(() => {
    // Only access window on client side
    setOrigin(window.location.origin)
  }, [])
  
  const shareUrl = shareId && origin ? `${origin}/board/share/${shareId}` : ""
  
  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: checked }),
      })
      
      if (!res.ok) throw new Error("Failed to update sharing settings")
      
      onTogglePublic(checked)
      toast.success(checked ? "Board is now public" : "Board is now private")
    } catch (error) {
      toast.error("Failed to update sharing settings")
    } finally {
      setLoading(false)
    }
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Link copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share board</DialogTitle>
          <DialogDescription>
            Make your board public to share it with others via a link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="public" className="flex flex-col gap-1">
              <span>Public access</span>
              <span className="text-sm text-muted-foreground font-normal">
                Anyone with the link can view this board
              </span>
            </Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
          
          {isPublic && shareId && (
            <div className="grid gap-2">
              <Label htmlFor="link">Share link</Label>
              <div className="flex gap-2">
                <Input
                  id="link"
                  value={shareUrl}
                  readOnly
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}