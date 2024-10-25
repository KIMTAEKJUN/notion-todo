import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Seoul");

// 날짜를 "M월 D일" 형식의 문자열로 반환
export const getDateStr = (date: Date = new Date()): string => {
  return dayjs(date).format("M월 D일");
};

// 날짜를 "YYYY-MM-DD" 형식의 문자열로 반환
export const getISODateStr = (date: Date = new Date()): string => {
  return dayjs(date).format("YYYY-MM-DD");
};

// 어제 날짜를 반환
export const getYesterday = (): Date => {
  return dayjs().subtract(1, "day").toDate();
};

// 주말인지 확인
export const isWeekend = (date: Date = new Date()): boolean => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

// 마지막 근무일을 반환
export const getLastWorkday = (): Date => {
  let date = dayjs();
  do {
    date = date.subtract(1, "day");
  } while (isWeekend(date.toDate())); // 주말이 아니면 종료
  return date.toDate();
};
