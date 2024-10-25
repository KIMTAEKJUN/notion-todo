// Notion Todo 섹션 인터페이스
export interface TodoSection {
  pendingTodos: string[];
  inProgressTodos: string[];
}

// Notion 블록 구조 인터페이스
export interface NotionBlock {
  type: string;
  heading_2?: {
    rich_text: Array<{ plain_text: string }>;
  };
  to_do?: {
    rich_text: Array<{ plain_text: string }>;
    checked: boolean;
  };
}

// Notion Todo 섹션 타입 Enum
export enum TodoSectionType {
  PENDING = "pending",
  IN_PROGRESS = "inProgress",
  NONE = "none",
}
