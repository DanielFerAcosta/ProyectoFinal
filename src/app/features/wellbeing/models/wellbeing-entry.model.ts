export interface WellbeingEntry {
  id: string;
  user_id: string;
  entry_date: string;
  water_ml: number;
  sleep_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface SaveWellbeingEntry {
  entry_date: string;
  water_ml: number;
  sleep_minutes: number;
}