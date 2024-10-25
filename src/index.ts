import cron from "node-cron";
import { NotionService } from "./services/notion.service";
import { SlackService } from "./services/slack.service";
import { handleError } from "./errors";
import { getDateStr, getLastWorkday, isWeekend } from "./utils/date";

class TodoApplication {
  private readonly notionService: NotionService;
  private readonly slackService: SlackService;

  constructor() {
    this.notionService = new NotionService();
    this.slackService = new SlackService();
    this.setupErrorHandlers();
  }

  // 전역 에러 핸들러 설정
  private setupErrorHandlers(): void {
    process.on("uncaughtException", this.handleProcessError.bind(this));
    process.on("unhandledRejection", this.handleProcessError.bind(this));
  }

  // 프로세스 에러 핸들러 (알림 전송)
  private async handleProcessError(error: Error): Promise<void> {
    console.error(`Process Error:`, error);
    await this.slackService
      .sendNotification({
        todayMessage:
          "🚨 Notion TODO 서비스에 예기치 못한 에러가 발생했습니다.",
        beforeDayMessage: "🧑🏻‍💻 서비스를 확인해주세요.",
        todos: {
          pendingTodos: [],
          inProgressTodos: [],
        },
      })
      .catch(console.error);
  }

  // 금일의 TODO 생성 및 알림 전송
  private async runDailyTodo(): Promise<void> {
    // 주말에는 실행하지 않음
    if (isWeekend()) {
      console.log("주말에는 실행하지 않습니다.");
      return;
    }

    try {
      const lastWorkday = getLastWorkday();
      const todayDateStr = getDateStr();
      const lastWorkdayStr = getDateStr(lastWorkday);

      // 1. 이전 날짜의 미완료 TODO 항목들을 가져옴
      const { pendingTodos, inProgressTodos } =
        await this.notionService.getYesterdayUncompletedTodos();

      // 2. 금일의 TODO 페이지를 생성
      await this.notionService.createDailyTodo();

      // 3. Slack으로 알림 전송
      await this.slackService.sendNotification({
        todayMessage: `📅 *금일 [${todayDateStr}]의 TODO가 생성되었습니다.*`,
        beforeDayMessage: `🛵 *전날 [${lastWorkdayStr}]의 미완료 항목이 이전되었습니다.*`,
        todos: {
          pendingTodos,
          inProgressTodos,
        },
      });

      console.log("✅ 모든 작업이 완료되었습니다.");
    } catch (error) {
      console.error("오류 발생:", error);
      handleError(error);
      throw error;
    }
  }

  public start(): void {
    // 평일 아침 8시 30분에 실행(월요일 ~ 금요일)
    cron.schedule("30 8 * * 1-5", async () => {
      try {
        await this.runDailyTodo();
      } catch (error) {
        console.error("CRON 작업 중 오류가 발생했습니다.", error);
      }
    });

    console.log("🚀 Notion TODO Application이 시작되었습니다.");
  }
}

const app = new TodoApplication();
app.start();
