export interface AccountProfile {
  id: string;
  email: string | null;
  created_at: string;
  trial_started_at: string;
  trial_ends_at: string;
  onboarding_completed: boolean;
  onboarding_answers?: Record<string, unknown> | null;
  updated_at: string;
}
