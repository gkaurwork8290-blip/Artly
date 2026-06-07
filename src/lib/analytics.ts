import posthog from 'posthog-js'

// ─── Posthog event tracking ───────────────────────────────────────────────────

export function trackEvent(event: string, properties?: Record<string, any>) {
  try {
    posthog.capture(event, properties)
  } catch {}
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  try {
    posthog.identify(userId, properties)
  } catch {}
}

export function resetUser() {
  try {
    posthog.reset()
  } catch {}
}

// ─── GA4 event tracking ───────────────────────────────────────────────────────

export function trackGA4Event(event: string, properties?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties)
    }
  } catch {}
}

// ─── Combined track (fires both Posthog + GA4) ───────────────────────────────

export function track(event: string, properties?: Record<string, any>) {
  trackEvent(event, properties)
  trackGA4Event(event, properties)
}

// ─── Artly-specific events ────────────────────────────────────────────────────

export const Analytics = {
  // App
  appOpened: (userType: 'guest' | 'free' | 'pro') =>
    track('app_opened', { user_type: userType }),

  // Landing
  signInClicked: () => track('sign_in_clicked'),
  guestContinued: () => track('guest_continued'),

  // Onboarding
  skillSelected: (skill: string) => track('skill_selected', { skill }),
  onboardingCompleted: (skill: string) => track('onboarding_completed', { skill }),
  onboardingSkipped: () => track('onboarding_skipped'),

  // Create — input
  inputMethodSelected: (method: 'upload' | 'camera' | 'describe') =>
    track('input_method_selected', { method }),
  materialsDetected: (count: number, materials: string[]) =>
    track('materials_detected', { material_count: count, materials }),
  materialsConfirmed: (count: number) =>
    track('materials_confirmed', { material_count: count }),

  // Create — ideas
  ideasGenerated: (count: number, skillLevel: string) =>
    track('ideas_generated', { idea_count: count, skill_level: skillLevel }),
  ideaSwiped: (direction: 'left' | 'right', ideaIndex: number) =>
    track('idea_swiped', { direction, idea_index: ideaIndex }),
  ideaHearted: (ideaTitle: string) =>
    track('idea_hearted', { idea_title: ideaTitle }),
  ideaUnhearted: (ideaTitle: string) =>
    track('idea_unhearted', { idea_title: ideaTitle }),
  projectStarted: (ideaTitle: string, difficulty: string) =>
    track('project_started', { idea_title: ideaTitle, difficulty }),

  // Project
  stepCompleted: (stepNumber: number, totalSteps: number, ideaTitle: string) =>
    track('step_completed', { step_number: stepNumber, total_steps: totalSteps, idea_title: ideaTitle }),
  projectCompleted: (ideaTitle: string) =>
    track('project_completed', { idea_title: ideaTitle }),

  // Journal
  journalOpened: (ideaTitle: string) =>
    track('journal_opened', { idea_title: ideaTitle }),
  journalSaved: (mood: string, rating: number, hasImage: boolean) =>
    track('journal_saved', { mood, rating, has_image: hasImage }),

  // Saved
  savedTabViewed: (tab: 'projects' | 'ideas' | 'journal') =>
    track('saved_tab_viewed', { tab }),

  // Profile
  themeChanged: (theme: 'dark' | 'light') =>
    track('theme_changed', { theme }),
  skillLevelChanged: (skill: string) =>
    track('skill_level_changed', { skill }),
  signedOut: () => track('signed_out'),

  // Usage / pricing
  usageLimitReached: (userType: 'guest' | 'free') =>
    track('usage_limit_reached', { user_type: userType }),
  pricingGateViewed: (userType: 'guest' | 'free') =>
    track('pricing_gate_viewed', { user_type: userType }),
  upgradeTapped: (tier: 'starter' | 'pro', billingPeriod: 'monthly' | 'annual') =>
    track('upgrade_tapped', { tier, billing_period: billingPeriod }),
  signInFromGate: () => track('sign_in_from_gate'),
}
