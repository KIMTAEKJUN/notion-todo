import cron from "node-cron";
import { NotionService } from "./services/notion.service";
import { SlackService } from "./services/slack.service";
import { handleError } from "./errors";
import { getDateStr, getLastWorkday, isWeekend } from "./utils/date";

const notionService = new NotionService();
const slackService = new SlackService();

async function runDailyTodo() {
  const lastWorkday = getLastWorkday();
  const lastWorkdayStr = getDateStr(lastWorkday);

  if (isWeekend()) {
    return;
  }

  try {
    // 1단계
    const { pendingTodos, inProgressTodos } =
      await notionService.getYesterdayUncompletedTodos();

    // 2단계
    const response = await notionService.createDailyTodo();

    // 3단계
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

// 매일 아침 8시에 실행, 주말에는 실행하지 않음
cron.schedule("0 8 * * 1-5", async () => {
  try {
    await runDailyTodo();
  } catch (error) {
    console.error("CRON 작업 중 오류가 발생했습니다.", error);
  }
});

if (process.argv.includes("--test")) {
  console.log("테스트 실행 시작...");
  runDailyTodo()
    .then(() => {
      console.log("테스트 실행 완료");
      process.exit(0); // 성공적으로 완료되면 프로세스 종료
    })
    .catch((error) => {
      console.error("테스트 실행 실패:", error);
      process.exit(1); // 에러가 있으면 에러 코드와 함께 종료
    });
}
