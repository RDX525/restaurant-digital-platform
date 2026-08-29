export const LIFECYCLE_STAGES = ["active", "inactive", "churned"] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const DEFAULT_LIFECYCLE_STAGE: LifecycleStage = "active";
