"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Bell, Database, HelpCircle, Star } from "lucide-react"

export function SettingsScreen() {
  const [realTimeProtection, setRealTimeProtection] = useState(true)
  const [autoBlock, setAutoBlock] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [sensitivity, setSensitivity] = useState([75])

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your protection</p>
        </div>
      </div>

      {/* Protection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Protection Settings
          </CardTitle>
          <CardDescription>Configure how ScamGuard protects your calls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Real-time Protection</p>
              <p className="text-sm text-muted-foreground">Analyze calls as they happen</p>
            </div>
            <Switch checked={realTimeProtection} onCheckedChange={setRealTimeProtection} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-block Scams</p>
              <p className="text-sm text-muted-foreground">Automatically reject high-risk calls</p>
            </div>
            <Switch checked={autoBlock} onCheckedChange={setAutoBlock} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Detection Sensitivity</p>
              <Badge variant="outline">{sensitivity[0]}%</Badge>
            </div>
            <Slider value={sensitivity} onValueChange={setSensitivity} max={100} min={25} step={5} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Higher sensitivity may flag more legitimate calls as suspicious
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Manage alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Scam Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified about potential scams</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </CardContent>
      </Card>

      {/* Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Scam Database
          </CardTitle>
          <CardDescription>Community-powered protection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">2.4M</div>
              <div className="text-xs text-muted-foreground">Known Scam Numbers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">Updated</div>
              <div className="text-xs text-muted-foreground">2 hours ago</div>
            </div>
          </div>
          <Button variant="outline" className="w-full bg-transparent">
            Update Database
          </Button>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Support & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-start">
            Help Center
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Report a Problem
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Star className="w-4 h-4 mr-2" />
            Rate ScamGuard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
