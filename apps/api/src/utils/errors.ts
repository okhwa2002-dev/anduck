export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest: (message = "잘못된 요청입니다.") => new AppError(400, "BAD_REQUEST", message),
  notFound: (message = "리소스를 찾을 수 없습니다.") => new AppError(404, "NOT_FOUND", message),
  conflict: (message = "이미 존재하는 데이터입니다.") => new AppError(409, "CONFLICT", message),
  forbidden: (message = '접근 권한이 없습니다.') => new AppError(403, 'FORBIDDEN', message),
};
