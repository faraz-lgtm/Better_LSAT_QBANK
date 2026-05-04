import { fireEvent, render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { Avatar } from "./avatar"
import { Badge } from "./badge"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Input } from "./input"
import { Radio, RadioGroup } from "./radio-group"
import { Select } from "./select"
import { Switch } from "./switch"
import { Textarea } from "./textarea"

describe("ui primitive variants", () => {
  it("renders button variant and size combinations", () => {
    render(
      <>
        <Button variant="default" size="default">Primary</Button>
        <Button variant="outline" size="icon-sm" aria-label="Filter icon" />
      </>,
    )

    expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Filter icon" })).toBeInTheDocument()
  })

  it("renders badge with dot and trailing icon", () => {
    render(<Badge dot trailingIcon={<span aria-label="trail">*</span>}>Ready</Badge>)
    expect(screen.getByText("Ready")).toBeInTheDocument()
    expect(screen.getByLabelText("trail")).toBeInTheDocument()
  })

  it("handles controlled switch and checkbox changes", () => {
    const onSwitch = vi.fn()
    const onCheckbox = vi.fn()
    render(
      <>
        <Switch checked onChange={onSwitch} />
        <Checkbox checked onChange={onCheckbox} />
      </>,
    )

    fireEvent.click(screen.getByRole("switch"))
    fireEvent.click(screen.getByRole("checkbox"))
    expect(onSwitch).toHaveBeenCalled()
    expect(onCheckbox).toHaveBeenCalled()
  })

  it("renders input, textarea, select, radio and avatar states", () => {
    render(
      <>
        <Input placeholder="email" size="sm" />
        <Textarea placeholder="details" variant="tag" />
        <Select
          defaultValue="lr"
          options={[
            { label: "LR", value: "lr" },
            { label: "RC", value: "rc" },
          ]}
        />
        <RadioGroup>
          <Radio name="mode" checked onChange={() => {}} />
          <Radio name="mode" onChange={() => {}} />
        </RadioGroup>
        <Avatar initials="FA" presence="online" size="xl" />
      </>,
    )

    expect(screen.getByPlaceholderText("email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("details")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toHaveValue("lr")
    expect(screen.getAllByRole("radio")).toHaveLength(2)
    expect(screen.getByText("FA")).toBeInTheDocument()
  })
})
