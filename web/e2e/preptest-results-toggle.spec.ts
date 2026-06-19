import { expect, test } from "@playwright/test"

const resultsPath = "/app/analytics/preptests/results/d5f5db19-b84a-4ac4-be8b-640bc022cc20"

test.describe("PrepTest results insights toggle", () => {
  test("signed-in user can toggle exclude from insights without white screen", async ({ page }) => {
    const email = process.env.E2E_STUDENT_EMAIL?.trim()
    const password = process.env.E2E_STUDENT_PASSWORD
    if (!email || !password) {
      test.skip()
      return
    }

    await page.goto("/login")
    await page.locator('input[type="email"]').nth(1).fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 45_000 })

    await page.goto(resultsPath)
    await expect(page.getByText("About this PrepTest")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText("YOUR SCORE")).toBeVisible()

    const toggle = page.getByRole("switch", { name: /exclude this preptest from insights/i })
    await expect(toggle).toBeVisible()

    const wasChecked = await toggle.isChecked()
    await toggle.click()

    await expect(toggle).toBeChecked({ checked: !wasChecked })
    await expect(page.getByText("About this PrepTest")).toBeVisible()
    await expect(page.getByText("YOUR SCORE")).toBeVisible()
    await expect(page.getByText("RESULTS BY SECTION")).toBeVisible()
  })
})
