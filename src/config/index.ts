import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  NOTION: {
    API_KEY: process.env.NOTION_API_KEY!,
    DATABASE_ID: process.env.NOTION_DATABASE_ID!,
  },
  SLACK: {
    TOKEN: process.env.SLACK_TOKEN!,
    CHANNEL: process.env.SLACK_CHANNEL || "#todo-notifications",
  },
};
