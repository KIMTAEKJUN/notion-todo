export const getDateStr = (date: Date = new Date()): string => {
  const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 1을 더함
  const day = date.getDate();
  return `${month}월 ${day}일`;
};

// API용 날짜 포맷 (ISO 8601)
export const getISODateStr = (date: Date = new Date()): string => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD 형식
};

export const isWeekend = (date: Date = new Date()): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0은 일요일, 6은 토요일
};

export const getLastWorkday = (): Date => {
  const date = new Date();
  do {
    date.setDate(date.getDate() - 1);
  } while (isWeekend(date));
  return date;
};
