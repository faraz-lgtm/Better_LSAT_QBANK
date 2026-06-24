import { expect, test } from "@playwright/test"

test.describe("Practice PrepTest flow", () => {
  test("legacy ?testId= redirects to hub path", async ({ page }) => {
    await page.goto("/app/preptest?testId=pt145")
    await expect(page).toHaveURL(/\/app\/practice\/preptest\/pt145$/)
  })

  test("preview does not unlock the rest of /app", async ({ page }) => {
    await page.goto("/app/preptest")
    await page.goto("/app")
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Practice PrepTest flow (optional signed-in check)", () => {
  test("signed-in user sees hub without preview banner", async ({ page }) => {
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
    await page.waitForURL(/\/app|\/onboarding|\/admin/, { timeout: 45_000 })

    if (page.url().includes("/onboarding")) {
      await page.goto("/app/preptest/pt145")
    }

    await page.goto("/app/preptest/pt145")
    await expect(page.getByText(/Ready to begin your test/i)).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/PrepTest UI preview/i)).toHaveCount(0)

    await page.getByRole("button", { name: /Start Section/i }).click()
    await expect(page).toHaveURL(/\/section\/s1/)
  })
})
