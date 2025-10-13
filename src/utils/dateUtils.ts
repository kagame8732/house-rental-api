export class DateUtils {
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  static formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString();
  }

  static isDateValid(date: string): boolean {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  static addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  static getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  static isDateExpired(endDate: Date | string): boolean {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  }

  static getDaysRemaining(endDate: Date | string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
