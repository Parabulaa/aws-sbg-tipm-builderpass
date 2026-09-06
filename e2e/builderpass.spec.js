import { test, expect } from '@playwright/test'

const eventId = '20000000-0000-4000-8000-000000000001'
const event = { id: eventId, title: 'Cloud workshop', description: 'Learn with the community.', event_date: '2099-01-01', start_time: '10:00:00', end_time: '12:00:00', venue: 'TIP Manila', capacity: 50, registration_status: 'OPEN', publication_status: 'PUBLISHED', visibility: 'PUBLIC', poster_path: null, recap: '' }
const pastEvent = { ...event, id: '20000000-0000-4000-8000-000000000002', title: 'Community recap', event_date: '2020-01-01', recap: 'Members built a demo together.' }
const user = { id: '10000000-0000-4000-8000-000000000001', email: 'member@example.test', aud: 'authenticated', role: 'authenticated', user_metadata: {}, app_metadata: {}, identities: [{ id: 'test' }] }

async function setup(page, { role, events = [event, pastEvent], failEvents = false } = {}) {
  let eventReads = 0
  const writes = []
  await page.route('https://builderpass.test/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    let body = []
    if (url.pathname === '/rest/v1/events') {
      if (request.method() !== 'GET') {
        writes.push(request.postDataJSON())
        body = [{ id: eventId }]
      } else {
        eventReads += 1
        if (failEvents) return route.fulfill({ status: 503, json: { message: 'Temporary failure' } })
        body = url.searchParams.has('id') ? events.filter(e => `eq.${e.id}` === url.searchParams.get('id')) : events
      }
    } else if (url.pathname === '/rest/v1/profiles') {
      body = [{ ...user, student_number: '1', first_name: 'Test', last_name: 'Member', course: 'BS Computer Science (BS CS)', year_level: 1, section: 'CS11', role }]
    } else if (url.pathname.includes('/rpc/get_events_rsvp_summaries')) {
      body = events.map(e => ({ event_id: e.id, capacity: 50, registered_count: 0, slots_remaining: 50, is_full: false }))
    } else if (url.pathname.includes('/rpc/get_event_rsvp_summary')) {
      body = [{ capacity: 50, registered_count: 0, slots_remaining: 50, is_full: false }]
    } else if (url.pathname === '/auth/v1/signup') {
      writes.push({ redirect: url.searchParams.get('redirect_to') })
      body = user
    } else if (url.pathname === '/auth/v1/user') {
      body = user
    } else if (url.pathname.includes('/auth/')) {
      body = {}
    }
    if (request.headers().accept?.includes('application/vnd.pgrst.object+json') && Array.isArray(body)) body = body[0] || null
    await route.fulfill({ json: body })
  })
  if (role) {
    await page.addInitScript(({ user }) => {
      localStorage.setItem('sb-builderpass-auth-token', JSON.stringify({ access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user }))
    }, { user })
  }
  return { eventReads: () => eventReads, writes }
}

for (const role of [undefined, 'MEMBER', 'OFFICER']) {
  test(`${role || 'guest'} search retains focus, caret, scroll, and loaded data`, async ({ page }) => {
    const mock = await setup(page, { role })
    await page.goto(role === 'OFFICER' ? '/admin/events' : '/events')
    const input = page.getByRole('textbox', { name: 'Search events by name' })
    await expect(input).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cloud workshop', exact: true })).toBeVisible()
    await input.focus()
    // Slower than the debounce, so every character changes the URL. This
    // reproduces the previous location.key remount rather than hiding it.
    const reads = mock.eventReads()
    const scroll = await page.evaluate(() => window.scrollY)
    await input.pressSequentially('Cloud', { delay: 380 })
    await expect(page).toHaveURL(/q=Cloud/)
    await expect(input).toHaveValue('Cloud')
    await expect(input).toBeFocused()
    expect(await input.evaluate(el => el.selectionStart)).toBe(5)
    expect(mock.eventReads()).toBe(reads)
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll)
    await input.press('ArrowLeft')
    await input.pressSequentially('X')
    await expect(input).toHaveValue('ClouXd')
    await expect(page).toHaveURL(/q=ClouXd/)
    await expect(input).toBeFocused()
    await page.getByRole('button', { name: 'Clear event search' }).click()
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    await input.fill('missing')
    await expect(page).toHaveURL(/q=missing/)
    await page.getByRole('button', { name: /Reset/ }).click()
    await expect(input).toHaveValue('')
    expect(mock.eventReads()).toBe(reads)
  })
}

test('homepage sections, real recaps, FAQ, and anchors work on mobile', async ({ page }) => {
  await setup(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Find your next event/, level: 1 })).toBeVisible()
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'FAQ', exact: true }).click()
  await expect(page).toHaveURL(/#faq$/)
  await expect(page.getByRole('heading', { name: 'Before you join.' })).toBeInViewport()
  await page.getByText('Can I browse events before creating an account?', { exact: true }).click()
  await expect(page.getByText('Yes. Publicly published events are available to everyone.', { exact: false })).toBeVisible()
  await expect(page.getByText('Members built a demo together.', { exact: true })).toBeAttached()
  await expect(page.locator('#member-stories')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/homepage-mobile.png', fullPage: true })
})

test('carousel pauses and stays stopped for reduced motion', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'Pause community slideshow' }).click()
  await expect(page.getByRole('button', { name: 'Play community slideshow' })).toBeVisible()
  const activeSlide = page.locator('button[aria-current="true"]')
  const pausedSlide = await activeSlide.getAttribute('aria-label')
  await page.clock.fastForward(12_000)
  await expect(activeSlide).toHaveAttribute('aria-label', pausedSlide)
  await page.getByRole('button', { name: 'Play community slideshow' }).click()
  await expect(page.getByRole('button', { name: 'Pause community slideshow' })).toBeVisible()
  await page.clock.fastForward(6_000)
  await expect(activeSlide).not.toHaveAttribute('aria-label', pausedSlide)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByText('Autoplay off', { exact: true })).toBeVisible()
  const reducedSlide = await activeSlide.getAttribute('aria-label')
  await page.clock.fastForward(12_000)
  await expect(activeSlide).toHaveAttribute('aria-label', reducedSlide)
})

test('public event signup and verification preserve the intended event', async ({ page }) => {
  const mock = await setup(page)
  await page.goto(`/events/${eventId}`)
  await page.getByRole('link', { name: 'Sign in to reserve' }).click()
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByRole('link', { name: 'Register here', exact: true }).click()
  await expect(page).toHaveURL(/\/register\?next=/)
  await page.getByLabel('AWS SBG Member ID', { exact: true }).fill('123456')
  await page.getByLabel('First name', { exact: true }).fill('Test')
  await page.getByLabel('Last name', { exact: true }).fill('Member')
  await page.getByLabel('Email', { exact: true }).fill('member@example.test')
  await page.getByRole('combobox', { name: 'Course or program', exact: true }).click()
  await page.getByRole('option', { name: 'BS Computer Science (BS CS)', exact: true }).click()
  await page.getByRole('combobox', { name: 'Year level' }).click()
  await page.getByRole('option', { name: /1/ }).click()
  await page.getByLabel('Password', { exact: true }).fill('BuilderPass123!')
  await page.getByLabel('Confirm password', { exact: true }).fill('BuilderPass123!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/verify-email\?next=/)
  expect(mock.writes[0].redirect).toContain(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`)
  await page.getByRole('link', { name: 'Sign in', exact: true }).click()
  expect(new URL(page.url()).searchParams.get('next')).toBe(`/events/${eventId}`)
})

test('signed-in users return to the selected event from a verification login link', async ({ page }) => {
  await setup(page, { role: 'MEMBER' })
  await page.goto(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`)
  await expect(page).toHaveURL(new RegExp(`/events/${eventId}$`))
  await expect(page.getByRole('button', { name: 'Reserve a spot' })).toBeVisible()
})

test('officer can edit publication, audience and recap independently of registration', async ({ page }) => {
  const mock = await setup(page, { role: 'OFFICER' })
  await page.goto(`/admin/events/${eventId}/edit`)
  await page.getByRole('combobox', { name: 'Publication', exact: true }).click()
  await page.getByRole('option', { name: /Draft/ }).click()
  await page.getByRole('combobox', { name: 'Audience', exact: true }).click()
  await page.getByRole('option', { name: 'Members only', exact: true }).click()
  await page.getByLabel('Event recap (optional)').fill('A verified event recap.')
  await page.getByRole('button', { name: /Save/ }).click()
  await expect(page).toHaveURL(/\/admin\/events$/)
  expect(mock.writes[0]).toMatchObject({ publication_status: 'DRAFT', visibility: 'MEMBERS', recap: 'A verified event recap.', registration_status: 'OPEN' })
})

test('public empty, error and unavailable event states are useful', async ({ page }) => {
  await setup(page, { events: [] })
  await page.goto('/events')
  await expect(page.getByText(/No public events are posted/)).toBeVisible()
  await page.goto(`/events/${eventId}`)
  await expect(page.getByRole('heading', { name: /isn’t publicly available/ })).toBeVisible()
  await page.unrouteAll()
  await setup(page, { failEvents: true })
  await page.goto('/events')
  await expect(page.getByText('We could not load public events. Please try again.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Try again/ })).toBeVisible()
})
