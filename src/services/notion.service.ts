import { Client } from "@notionhq/client";
import { CONFIG } from "../config/index";
import { AppError } from "../errors";
import { createHeading, createTodo, createParagraph } from "../utils/blocks";
import { getDateStr, getISODateStr, getLastWorkday } from "../utils/date";
import {
  CreatePageResponse,
  BlockObjectRequest,
} from "@notionhq/client/build/src/api-endpoints";

export class NotionService {
  private client: Client;

  constructor() {
    this.client = new Client({ auth: CONFIG.NOTION.API_KEY });
  }

  // 이전 날짜의 미완료된 TODO 항목들을 가져오는 메서드
  async getYesterdayUncompletedTodos(): Promise<{
    pendingTodos: string[];
    inProgressTodos: string[];
  }> {
    try {
      const lastWorkday = getLastWorkday();
      const dateStr = getDateStr(lastWorkday);
      const isoDate = getISODateStr(lastWorkday);

      // Notion 데이터베이스에서 특정 날짜에 해당하는 TODO 페이지를 조회
      const response = await this.client.databases.query({
        database_id: CONFIG.NOTION.DATABASE_ID,
        filter: {
          and: [
            {
              property: "이름",
              title: {
                contains: dateStr,
              },
            },
            {
              property: "날짜",
              date: {
                equals: isoDate,
              },
            },
          ],
        },
      });

      // 해당 날짜의 페이지가 없는 경우 빈 배열 반환
      if (!response.results.length) {
        return {
          pendingTodos: [],
          inProgressTodos: [],
        };
      }

      // 해당 페이지의 블록들을 조회 (TODO 항목들이 블록으로 저장됨)
      const blocks = await this.client.blocks.children.list({
        block_id: response.results[0].id,
      });

      // 미완료된 TODO 항목들을 추출
      const { pendingTodos, inProgressTodos } = this.extractTodos(
        blocks.results
      );

      // 추출된 TODO 항목들 반환
      return {
        pendingTodos,
        inProgressTodos,
      };
    } catch (error) {
      throw new AppError("할 일 목록을 불러오는 중 오류가 발생했습니다.", 500);
    }
  }

  // 페이지 블록에서 미완료된 TODO 항목을 추출하는 메서드
  private extractTodos(blocks: any[]): {
    pendingTodos: string[];
    inProgressTodos: string[];
  } {
    const pendingTodos: string[] = [];
    const inProgressTodos: string[] = [];
    let currentSection = "";

    for (const block of blocks) {
      // 섹션 구분: "진행전", "진행중" 헤더를 기준으로 현재 섹션을 추적
      if (block.type === "heading_2") {
        const text = block.heading_2.rich_text[0]?.plain_text || "";

        if (text.includes("진행전")) currentSection = "pending";
        else if (text.includes("진행중")) currentSection = "inProgress";
        else currentSection = "";
        continue;
      }

      // TODO 항목 추출: 체크되지 않은 항목만 추출
      if (block.type === "to_do") {
        const text = block.to_do.rich_text[0]?.plain_text || "";
        const isChecked = block.to_do.checked || false;

        if (text && !isChecked) {
          if (currentSection === "pending") {
            pendingTodos.push(text);
          } else if (currentSection === "inProgress") {
            inProgressTodos.push(text);
          }
        }
      }
    }
    return { pendingTodos, inProgressTodos };
  }

  // 금일 TODO 페이지를 생성하는 메서드
  async createDailyTodo(): Promise<CreatePageResponse> {
    try {
      const today = new Date();
      console.log("생성될 TODO 날짜:", {
        dateStr: getDateStr(today),
        isoDate: getISODateStr(today),
      });

      const lastWorkday = getLastWorkday();
      console.log("가져올 미완료 항목 날짜:", {
        dateStr: getDateStr(lastWorkday),
        isoDate: getISODateStr(lastWorkday),
      });

      const { pendingTodos, inProgressTodos } =
        await this.getYesterdayUncompletedTodos();

      // 금일 TODO 페이지에 포함할 블록들 생성
      const children: BlockObjectRequest[] = [
        createHeading("🚀 진행전인 작업"),
        ...(pendingTodos.length > 0
          ? pendingTodos.map((todo) => createTodo(todo))
          : [createTodo()]), // TODO 항목이 없으면 기본 항목 생성
        createParagraph(),

        createHeading("📝 진행중인 작업"),
        ...(inProgressTodos.length > 0
          ? inProgressTodos.map((todo) => createTodo(todo))
          : [createTodo()]),
        createParagraph(),

        createHeading("✅ 완료된 작업"),
        createTodo(),
        createParagraph(),

        createHeading("📚 학습 노트"),
        createParagraph(),
      ];

      // Notion 페이지 생성 요청
      const response = await this.client.pages.create({
        parent: {
          database_id: CONFIG.NOTION.DATABASE_ID,
        },
        icon: {
          type: "emoji",
          emoji: "📅",
        },
        properties: {
          이름: {
            title: [
              {
                text: {
                  content: `${getDateStr(today)} TODO`,
                },
              },
            ],
          },
          날짜: {
            date: {
              start: getISODateStr(today),
            },
          },
          태그: {
            multi_select: [
              {
                name: "TODO",
              },
            ],
          },
        },
        children,
      });

      return response;
    } catch (error) {
      throw new AppError("TODO를 생성하는 중 오류가 발생했습니다.", 500);
    }
  }
}
