import dotenv from "dotenv";
import { AppError } from "../errors";

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

if (!CONFIG.NOTION.API_KEY || !CONFIG.NOTION.DATABASE_ID) {
  throw new AppError("환경 변수를 설정해주세요.", 500);
}
