"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Phone, Shield, AlertTriangle, Clock, Settings, Search } from "lucide-react"

export function HomeScreen() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)

  const recentCalls = [
    { number: "+1 (555) 123-4567", time: "2 min ago", status: "safe", name: "John Smith" },
    { number: "+1 (800) 555-0199", time: "1 hour ago", status: "scam", name: "Unknown" },
    { number: "+1 (555) 987-6543", time: "3 hours ago", status: "safe", name: "Sarah Johnson" },
    { number: "+1 (888) 555-0123", time: "1 day ago", status: "suspicious", name: "Unknown" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      case "scam":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "suspicious":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <Shield className="w-3 h-3" />
      case "scam":
        return <AlertTriangle className="w-3 h-3" />
      case "suspicious":
        return <AlertTriangle className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">ScamGuard</h1>
          <p className="text-sm text-muted-foreground">Real-time call protection</p>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Protection Status */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Protection Active</p>
              <p className="text-sm text-muted-foreground">Monitoring all incoming calls</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Dial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Make a Call</CardTitle>
          <CardDescription>Enter a number to call with scam protection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button className="w-full" size="lg" onClick={() => setIsCallActive(true)} disabled={!phoneNumber}>
            <Phone className="w-4 h-4 mr-2" />
            Call with Protection
          </Button>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Calls</CardTitle>
          <CardDescription>Your call history with scam detection results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentCalls.map((call, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div className="flex-1">
                <p className="font-medium text-sm">{call.name}</p>
                <p className="text-xs text-muted-foreground">{call.number}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${getStatusColor(call.status)}`}>
                  {getStatusIcon(call.status)}
                  <span className="ml-1 capitalize">{call.status}</span>
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {call.time}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">247</div>
            <div className="text-xs text-muted-foreground">Calls Protected</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">18</div>
            <div className="text-xs text-muted-foreground">Scams Blocked</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">92%</div>
            <div className="text-xs text-muted-foreground">Detection Rate</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
