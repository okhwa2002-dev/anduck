export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "잘못된 요청입니다") {
    super(400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "리소스를 찾을 수 없습니다") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "이미 존재하는 데이터입니다") {
    super(409, message);
  }
}
