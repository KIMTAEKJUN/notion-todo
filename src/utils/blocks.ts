import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

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

export const createParagraph = (): BlockObjectRequest => ({
  object: "block",
  type: "paragraph",
  paragraph: {
    rich_text: [],
  },
});
