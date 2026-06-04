export interface CareCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon_key?: string | null;
  display_order: number;
  is_active: boolean;
}

export type CareCategorySummary = Pick<CareCategory, "id" | "slug" | "name" | "icon_key">;
