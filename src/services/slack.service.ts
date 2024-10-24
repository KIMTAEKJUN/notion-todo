import { WebClient } from "@slack/web-api";
import { CONFIG } from "../config";
import { AppError } from "../errors";

export class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(CONFIG.SLACK.TOKEN);
  }

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

      if (pendingTodos.length || inProgressTodos.length) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${beforeDayMessage}`,
          },
        });
      }

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
