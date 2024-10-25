import { TodoSection } from "./notion.types";

// Slack 메시지 구조 인터페이스
export interface SlackBlock {
  type: "section";
  text: {
    type: "mrkdwn";
    text: string;
  };
}

// Slack 알림 내용 구조 인터페이스
export interface SlackNotificationContent {
  todayMessage: string;
  beforeDayMessage: string;
  todos: TodoSection;
}
