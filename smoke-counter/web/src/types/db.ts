export type Profile = {
  id: string;
  display_name: string | null;
  daily_goal: number;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type SmokeEvent = {
  id: string;
  user_id: string;
  smoked_at: string;
  count: number;
  note: string | null;
  created_at: string;
};
