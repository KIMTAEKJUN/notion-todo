import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

// TODO 제목을 생성
export const createHeading = (content: string): BlockObjectRequest => ({
  object: "block",
  type: "heading_2",
  heading_2: {
    rich_text: [
      {
        type: "text",
        text: { content },
      },
    ],
  },
});

// TODO 항목을 생성
export const createTodo = (content: string = ""): BlockObjectRequest => ({
  object: "block",
  type: "to_do",
  to_do: {
    rich_text: [
      {
        type: "text",
        text: { content },
      },
    ],
    checked: false,
  },
});

// TODO 빈 단락을 생성
export const createParagraph = (): BlockObjectRequest => ({
  object: "block",
  type: "paragraph",
  paragraph: {
    rich_text: [],
  },
});
