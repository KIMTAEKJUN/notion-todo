import cron from "node-cron";
import { NotionService } from "./services/notion.service";
import { SlackService } from "./services/slack.service";
import { handleError } from "./errors";
import { getDateStr, getLastWorkday, isWeekend } from "./utils/date";

const notionService = new NotionService();
const slackService = new SlackService();

process.on("uncaughtException", (error) => {
  console.error("uncaughtException 발생:", error);
  slackService
    .sendNotification(
      "🚨 Notion TODO 서비스에 예기치 못한 에러가 발생했습니다.",
      "🧑🏻‍💻 서비스를 확인해주세요.",
      [],
      []
    )
    .catch(console.error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("unhandledRejection 발생:", reason, promise);
  slackService
    .sendNotification(
      "🚨 Notion TODO 서비스에 예기치 못한 에러가 발생했습니다.",
      "🧑🏻‍💻 서비스를 확인해주세요.",
      [],
      []
    )
    .catch(console.error);
});

async function runDailyTodo() {
  const lastWorkday = getLastWorkday();
  const lastWorkdayStr = getDateStr(lastWorkday);

  // 주말인 경우 실행하지 않음
  if (isWeekend()) {
    return;
  }

  try {
    // 1. 이전 날짜의 미완료 TODO 항목들을 가져옴
    const { pendingTodos, inProgressTodos } =
      await notionService.getYesterdayUncompletedTodos();

    // 2. 금일의 TODO 페이지를 생성
    const response = await notionService.createDailyTodo();

    // 3. Slack으로 알림 전송
    await slackService.sendNotification(
      `📅 *금일 [${getDateStr()}]의 TODO가 생성되었습니다.*`,
      `🛵 *전날 [${lastWorkdayStr}]의 미완료 항목이 이전되었습니다.*`,
      pendingTodos,
      inProgressTodos
    );

    console.log("✅ 모든 작업이 완료되었습니다.");
    return response;
  } catch (error) {
    console.error("오류 발생:", error);
    handleError(error);
    throw error;
  }
}

// 평일 아침 8시 30분에 실행
cron.schedule("30 8 * * 1-5", async () => {
  try {
    await runDailyTodo();
  } catch (error) {
    console.error("CRON 작업 중 오류가 발생했습니다.", error);
  }
});
