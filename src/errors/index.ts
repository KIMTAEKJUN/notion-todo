export class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    console.error(`❌ Error ${error.statusCode} 
                     메시지: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`❌ Error ${error.name} 
                     메시지: ${error.message}`);
  } else {
    console.error("❌ 알 수 없는 에러가 발생했습니다.");
  }
}
