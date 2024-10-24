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

  async getYesterdayUncompletedTodos(): Promise<{
    pendingTodos: string[];
    inProgressTodos: string[];
  }> {
    try {
      const lastWorkday = getLastWorkday();
      const dateStr = getDateStr(lastWorkday);
      const isoDate = getISODateStr(lastWorkday);

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

      if (!response.results.length) {
        return {
          pendingTodos: [],
          inProgressTodos: [],
        };
      }

      const blocks = await this.client.blocks.children.list({
        block_id: response.results[0].id,
      });

      const { pendingTodos, inProgressTodos } = this.extractTodos(
        blocks.results
      );

      return {
        pendingTodos,
        inProgressTodos,
      };
    } catch (error) {
      throw new AppError("할 일 목록을 불러오는 중 오류가 발생했습니다.", 500);
    }
  }

  private extractTodos(blocks: any[]): {
    pendingTodos: string[];
    inProgressTodos: string[];
  } {
    const pendingTodos: string[] = [];
    const inProgressTodos: string[] = [];
    let currentSection = "";

    for (const block of blocks) {
      if (block.type === "heading_2") {
        const text = block.heading_2.rich_text[0]?.plain_text || "";

        if (text.includes("진행전")) currentSection = "pending";
        else if (text.includes("진행중")) currentSection = "inProgress";
        else currentSection = "";
        continue;
      }

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

  async createDailyTodo(): Promise<CreatePageResponse> {
    try {
      const today = new Date();
      const { pendingTodos, inProgressTodos } =
        await this.getYesterdayUncompletedTodos();

      const children: BlockObjectRequest[] = [
        createHeading("🚀 진행전 작업"),
        ...(pendingTodos.length > 0
          ? pendingTodos.map((todo) => createTodo(todo))
          : [createTodo()]),
        createParagraph(),

        createHeading("📝 진행중 작업"),
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
