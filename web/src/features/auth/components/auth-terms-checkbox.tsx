import { Checkbox } from "@/components/ui/checkbox"

type AuthTermsCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function AuthTermsCheckbox({ checked, onChange, disabled = false }: AuthTermsCheckboxProps) {
  return (
    <label className="figma-gap-8 figma-text-sm figma-track-sm inline-flex items-center font-medium text-[#666d80]">
      <Checkbox
        size="md"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        I agree to{" "}
        <span className="font-semibold text-[#0d47a1]">BetterLSAT&apos;s Terms of Service</span>{" "}
        <span className="text-[#df1c41]">*</span>
      </span>
    </label>
  )
}

export { AuthTermsCheckbox }
