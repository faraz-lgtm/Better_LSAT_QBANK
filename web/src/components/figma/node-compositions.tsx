import { FigmaIcon } from "@/components/icons/figma-icons"
import { Annotation } from "@/components/ui/annotation"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

function Node177752512Frame3() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 17775:2512 (Frame 3)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" dot>
            Live session
          </Badge>
          <Badge variant="outline">Node composition</Badge>
          <Badge variant="success" trailingIcon={<FigmaIcon name="check-circle" className="size-3.5" />}>
            Synced
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input defaultValue="RC Comparative Passage Sprint" />
          <Select
            defaultValue="hard"
            options={[
              { label: "Easy", value: "easy" },
              { label: "Medium", value: "medium" },
              { label: "Hard", value: "hard" },
            ]}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Node177801428Button() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 17780:1428 (Button states)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button>Selected</Button>
        <Button variant="secondary">Active</Button>
        <Button variant="outline">Default</Button>
      </CardContent>
    </Card>
  )
}

function Node177801922Video() {
  const rows = ["Default", "Hover", "Selected", "Complete"] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 17780:1922 (Video)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="ds-body-sm">{row}</span>
            <Button size="sm" variant={row === "Selected" ? "default" : row === "Complete" ? "secondary" : "ghost"}>
              Open lesson
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function Node177881790Status() {
  const statuses = ["In Process", "Fresh", "Answered", "Fresh 2", "Status5"] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 17788:1790 (Status)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Badge key={status} variant={status === "Answered" ? "success" : "neutral"}>{status}</Badge>
        ))}
      </CardContent>
    </Card>
  )
}

function Node177881923Level() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 17788:1923 (Level)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {[5, 4, 3, 2, 1, 0].map((level) => (
          <Button key={level} size="xs" variant="outline">
            Level {level}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

function Node178023235Lessons() {
  const rows = ["Complete", "Hover", "Selected", "Default"] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 17802:3235 (Lessons)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-between rounded-lg border p-3">
            <span className="ds-body-sm">{row}</span>
            <FigmaIcon
              name={row === "Complete" ? "check-circle" : row === "Hover" ? "eye" : "arrow-circle-right"}
              className="size-4 text-primary"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function Node9761535Design() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 9761:535</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Search question stem..." />
          <Select
            options={[
              { label: "Inference", value: "inference" },
              { label: "Strengthen", value: "strengthen" },
              { label: "Weaken", value: "weaken" },
            ]}
            defaultValue="inference"
          />
        </div>
        <Textarea placeholder="Custom drill notes..." />
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <span className="ds-body-sm">Timed mode</span>
          <Switch checked onChange={() => {}} />
        </div>
      </CardContent>
    </Card>
  )
}

function Node2382409Design() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 238:2409</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 rounded-lg border p-3">
          <p className="ds-body-sm">Section composition from requested Figma node.</p>
          <RadioGroup>
            <label className="inline-flex items-center gap-2 text-sm">
              <Radio checked name="studyFocus" onChange={() => {}} />
              Focus weak question types
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <Radio name="studyFocus" onChange={() => {}} />
              Balanced question mix
            </label>
          </RadioGroup>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked onChange={() => {}} size="sm" />
            Include missed questions only
          </label>
        </div>
        <Button variant="secondary">Continue</Button>
      </CardContent>
    </Card>
  )
}

function Node77552113Design() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node 7755:2113</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="warning">In review</Badge>
          <Badge variant="success">Synced</Badge>
          <Button size="sm">Open</Button>
        </div>
        <div className="space-y-2">
          {[
            { initials: "FA", name: "Faraz", status: "Reviewing set A", presence: "online" as const },
            { initials: "LS", name: "Lina", status: "Queued for sync", presence: "offline" as const },
          ].map((member) => (
            <div key={member.name} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar initials={member.initials} presence={member.presence} size="md" />
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.status}</p>
                </div>
              </div>
              <FigmaIcon name="dots-vertical" className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Node137771222Compositions() {
  return (
    <div className="space-y-4">
      <Annotation title="Components" description="Composed sections derived from all nodes under 13777:1222." />
      <Node177752512Frame3 />
      <Node177801428Button />
      <Node177801922Video />
      <Node177881790Status />
      <Node177881923Level />
      <Node178023235Lessons />
      <Node9761535Design />
      <Node2382409Design />
      <Node77552113Design />
    </div>
  )
}

export {
  Node137771222Compositions,
  Node177752512Frame3,
  Node177801428Button,
  Node177801922Video,
  Node177881790Status,
  Node177881923Level,
  Node178023235Lessons,
  Node9761535Design,
  Node2382409Design,
  Node77552113Design,
}
