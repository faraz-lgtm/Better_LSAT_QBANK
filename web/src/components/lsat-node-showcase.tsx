import { useState } from "react"

import { SystemIcon } from "@/components/icons"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

function LsatNodeShowcase() {
  const [trackType, setTrackType] = useState("timed")
  const [streakMode, setStreakMode] = useState(true)
  const [reviewWrongOnly, setReviewWrongOnly] = useState(false)

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Node 17775:2512 - Session Composer</CardTitle>
          <CardDescription>Composed from primitives mapped from Figma form and action surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Session title" defaultValue="LR Weaken Drill - Set A" />
          <Select
            defaultValue="lr"
            options={[
              { label: "Logical Reasoning", value: "lr" },
              { label: "Reading Comprehension", value: "rc" },
              { label: "Logic Games", value: "la" },
            ]}
          />
          <RadioGroup className="sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <Radio
                name="trackType"
                checked={trackType === "timed"}
                onChange={() => setTrackType("timed")}
              />
              Timed mode
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <Radio
                name="trackType"
                checked={trackType === "untimed"}
                onChange={() => setTrackType("untimed")}
              />
              Untimed mode
            </label>
          </RadioGroup>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div className="inline-flex items-center gap-2 text-sm">
              <SystemIcon name="cycle" size="xs" tone="muted" />
              Enable streak momentum
            </div>
            <Switch checked={streakMode} onChange={(event) => setStreakMode(event.target.checked)} />
          </div>
          <Textarea placeholder="Optional instructions for this run..." variant="tag" />
        </CardContent>
        <CardFooter>
          <Button>
            <SystemIcon name="play" size="xs" />
            Start session
          </Button>
          <Button variant="outline">
            <SystemIcon name="bookmark" size="xs" tone="muted" />
            Save template
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Node 9761:535 - Progress Snapshot</CardTitle>
          <CardDescription>Status and roster composition with badge and avatar states.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">PT-84</Badge>
            <Badge variant="success">+7 this week</Badge>
            <Badge variant="outline">Accuracy 82%</Badge>
          </div>
          <div className="space-y-2">
            {[
              { name: "Ari", status: "On track", icon: "target" as const, online: true },
              { name: "Nina", status: "Needs review", icon: "status" as const, online: false },
              { name: "Sam", status: "Ready for RC", icon: "book" as const, online: true },
            ].map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    initials={member.name.slice(0, 2).toUpperCase()}
                    presence={member.online ? "online" : "offline"}
                  />
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.status}</p>
                  </div>
                </div>
                <SystemIcon name={member.icon} size="xs" tone={member.online ? "success" : "warning"} />
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={reviewWrongOnly} onChange={(event) => setReviewWrongOnly(event.target.checked)} size="sm" />
            Review wrong answers only
          </label>
        </CardContent>
      </Card>
    </section>
  )
}

export { LsatNodeShowcase }
