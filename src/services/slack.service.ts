import { WebClient } from "@slack/web-api";
import { CONFIG } from "../config";
import { AppError } from "../errors";
import { SlackNotificationContent, SlackBlock } from "../types/slack.types";

export class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(CONFIG.SLACK.TOKEN);
  }

  // TODO 생성 알림을 해당 채널로 전송
  async sendNotification({
    todayMessage,
    beforeDayMessage,
    todos: { pendingTodos, inProgressTodos },
  }: SlackNotificationContent): Promise<void> {
    try {
      const blocks = this.buildBlocks({
        todayMessage,
        beforeDayMessage,
        pendingTodos,
        inProgressTodos,
      });

      await this.client.chat.postMessage({
        channel: CONFIG.SLACK.CHANNEL,
        text: todayMessage,
        blocks,
      });
    } catch (error) {
      throw new AppError("슬랙 알림 전송 실패", 503);
    }
  }

  // 메시지를 생성
  private buildBlocks({
    todayMessage,
    beforeDayMessage,
    pendingTodos,
    inProgressTodos,
  }: {
    todayMessage: string;
    beforeDayMessage: string;
    pendingTodos: string[];
    inProgressTodos: string[];
  }): SlackBlock[] {
    const blocks: SlackBlock[] = [this.createBlock(todayMessage)];

    const hasTodos = pendingTodos.length > 0 || inProgressTodos.length > 0;
    if (hasTodos) {
      blocks.push(this.createBlock(beforeDayMessage));

      if (pendingTodos.length) {
        blocks.push(
          this.createBlock(
            `*🚀 미완료된 진행전 작업:*\n${this.formatTodos(pendingTodos)}`
          )
        );
      }

      if (inProgressTodos.length) {
        blocks.push(
          this.createBlock(
            `*📝 미완료된 진행중 작업:*\n${this.formatTodos(inProgressTodos)}`
          )
        );
      }
    }

    return blocks;
  }

  // 단일 블록을 생성
  private createBlock(text: string): SlackBlock {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text,
      },
    };
  }

  private formatTodos(todos: string[]): string {
    return todos.map((todo) => `• ${todo}`).join("\n");
  }

  // 에러 발생 시 알림 전송
  async sendErrorNotification(errorMessage: string): Promise<void> {
    await this.sendNotification({
      todayMessage: `🚨 ${errorMessage}`,
      beforeDayMessage: "🧑🏻‍💻 서비스를 확인해주세요.",
      todos: {
        pendingTodos: [],
        inProgressTodos: [],
      },
    });
  }
}
