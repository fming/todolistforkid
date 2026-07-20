export interface StudyPlan {
  /** Subject identifier, e.g. "语文", "数学". Used as the storage key. */
  subject: string;
  /** Markdown body. */
  content: string;
  /** ISO timestamp of last save. */
  updatedAt: string;
}
