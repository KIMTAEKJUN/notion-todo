import { WebClient } from "@slack/web-api";
import { CONFIG } from "../config";
import { AppError } from "../errors";

export class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(CONFIG.SLACK.TOKEN);
  }

  // TODO 생성 알림을 Slack 채널로 전송하는 메서드
  async sendNotification(
    todayMessage: string,
    beforeDayMessage: string,
    pendingTodos: string[],
    inProgressTodos: string[]
  ): Promise<void> {
    try {
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${todayMessage}`,
          },
        },
      ];

      // 이전 날짜의 미완료 항목이 있는 경우
      if (pendingTodos.length || inProgressTodos.length) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${beforeDayMessage}`,
          },
        });
      }

      // 미완료된 진행전 작업 목록을 추가
      if (pendingTodos.length) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🚀 미완료된 진행전 작업:*\n${pendingTodos
              .map((todo) => `• ${todo}`)
              .join("\n")}`,
          },
        });
      }

      // 미완료된 진행 중 작업 목록을 추가
      if (inProgressTodos.length) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📝 미완료된 진행중 작업:*\n${inProgressTodos
              .map((todo) => `• ${todo}`)
              .join("\n")}`,
          },
        });
      }

      // Slack 메시지 전송
      await this.client.chat.postMessage({
        channel: CONFIG.SLACK.CHANNEL,
        text: todayMessage,
        blocks,
      });
    } catch (error) {
      throw new AppError("슬랙 알림 전송 실패", 503);
    }
  }
}
