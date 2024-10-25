import { Client } from "@notionhq/client";
import { CONFIG } from "../config/index";
import { AppError } from "../errors";
import { createHeading, createTodo, createParagraph } from "../utils/blocks";
import { getDateStr, getISODateStr, getLastWorkday } from "../utils/date";
import {
  NotionBlock,
  TodoSection,
  TodoSectionType,
} from "../types/notion.types";
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
  async getYesterdayUncompletedTodos(): Promise<TodoSection> {
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

      return this.extractTodos(blocks.results as NotionBlock[]);
    } catch (error) {
      throw new AppError("할 일 목록을 불러오는 중 오류가 발생했습니다.", 500);
    }
  }

  // 금일 TODO 페이지를 생성하는 메서드
  async createDailyTodo(): Promise<CreatePageResponse> {
    try {
      const today = new Date();
      const { pendingTodos, inProgressTodos } =
        await this.getYesterdayUncompletedTodos();

      const children = this.buildPageBlocks({ pendingTodos, inProgressTodos });

      return this.client.pages.create({
        parent: { database_id: CONFIG.NOTION.DATABASE_ID },
        icon: { type: "emoji", emoji: "📅" },
        properties: this.buildPageProperties(today),
        children,
      });
    } catch (error) {
      throw new AppError("TODO 생성 실패", 500);
    }
  }

  // 페이지 블록에서 미완료된 TODO 항목을 추출하는 메서드
  private extractTodos(blocks: NotionBlock[]): TodoSection {
    return {
      pendingTodos: this.getTodosBySection(blocks, TodoSectionType.PENDING),
      inProgressTodos: this.getTodosBySection(
        blocks,
        TodoSectionType.IN_PROGRESS
      ),
    };
  }

  // 블록의 섹션을 업데이트하는 메서드
  private updateCurrentSection(
    block: NotionBlock,
    currentSection: TodoSectionType
  ): TodoSectionType {
    if (block.type !== "heading_2") return currentSection;

    const text = block.heading_2?.rich_text[0]?.plain_text || "";

    if (text.includes("진행전")) return TodoSectionType.PENDING;
    if (text.includes("진행중")) return TodoSectionType.IN_PROGRESS;

    return TodoSectionType.NONE;
  }

  // 블록에서 TODO 항목을 추출하는 메서드
  private extractTodoText(block: NotionBlock): string | null {
    if (block.type !== "to_do") return null;

    const todoData = block.to_do;
    if (!todoData || todoData.checked) return null;

    const text = todoData.rich_text[0]?.plain_text;
    return text || null;
  }

  // 페이지 생성에 필요한 속성을 생성하는 메서드
  private buildPageProperties(date: Date) {
    return {
      이름: {
        title: [
          {
            text: { content: `${getDateStr(date)} TODO` },
          },
        ],
      },
      날짜: {
        date: { start: getISODateStr(date) },
      },
      태그: {
        multi_select: [{ name: "TODO" }],
      },
    };
  }

  // 특정 섹션의 TODO 항목을 추출하는 메서드
  private getTodosBySection(
    blocks: NotionBlock[],
    targetSection: TodoSectionType
  ): string[] {
    let currentSection = TodoSectionType.NONE;
    const todos: string[] = [];

    for (const block of blocks) {
      currentSection = this.updateCurrentSection(block, currentSection);

      if (currentSection === targetSection) {
        const todoText = this.extractTodoText(block);
        if (todoText) todos.push(todoText);
      }
    }

    return todos;
  }

  // 페이지 블록을 생성하는 메서드
  private buildPageBlocks({
    pendingTodos,
    inProgressTodos,
  }: TodoSection): BlockObjectRequest[] {
    return [
      createHeading("🚀 진행전인 작업"),
      ...(pendingTodos.length ? pendingTodos.map(createTodo) : [createTodo()]),
      createParagraph(),

      createHeading("📝 진행중인 작업"),
      ...(inProgressTodos.length
        ? inProgressTodos.map(createTodo)
        : [createTodo()]),
      createParagraph(),

      createHeading("✅ 완료된 작업"),
      createTodo(),
      createParagraph(),

      createHeading("📚 학습 노트"),
      createParagraph(),
    ];
  }
}
