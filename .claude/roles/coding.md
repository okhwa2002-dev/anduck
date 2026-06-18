# 코딩 규칙 — TypeScript / Fastify

## 아키텍처 흐름

```
HTTP 요청
  → routes/*.ts        경로·타입 제네릭·preHandler·config 등록만
  → controllers/*.ts   req 파싱, service 호출, 응답 반환
  → services/*.ts      비즈니스 로직 (FastifyRequest/Reply 의존 없음)
  → utils/db.ts        query / queryOne / execute / buildSQL
  → mapper/*.xml       SQL
  → PostgreSQL
```

- **routes**: 경로 문자열, 타입 제네릭, `preHandler`, `rateLimit` config만. 로직 없음.
- **controllers**: `req.params/body/query` 추출 → service 호출 → 반환. `req.server.jwt`로 JWT 서명.
- **services**: DB 호출·비즈니스 로직만. HTTP 개념 없음.
- 이미지는 항상 별도 `getImages()` 호출 후 `mappers.ts`에서 조인.

---

## import 스타일

```typescript
// 내부 유틸/DB — namespace import
import * as db from "../utils/db";
import * as utils from "../utils";

// 에러 클래스 — named import
import { AppError, BadRequestError, NotFoundError, ConflictError } from "../utils/errors";

// 타입 패키지 — type-only namespace import
import type * as types from "@anduck/types";

// 서비스·매퍼 간 의존 — default import
import imagesService from "./imagesService";
import mappers from "./mappers";

// 컨트롤러에서 서비스, 라우트에서 컨트롤러 — default import
import adminService from "../services/adminService";
import adminController from "../controllers/adminController";
```

---

## export 스타일

### 서비스 파일
함수를 선언 후 하단에서 `export default` 객체로 묶는다. 호이스팅으로 상호 호출 가능.

```typescript
async function listPrograms(q: types.ListQuery = {}) { ... }
async function getProgram(id: string) { ... }
// removeProgram → updateProgram 내부 호출 가능 (호이스팅)

export default { listPrograms, getProgram, ... };
```

### 컨트롤러 파일
서비스와 동일한 패턴. `reply`가 필요한 핸들러만 두 번째 파라미터 선언.

```typescript
type Req<T extends Record<string, unknown> = Record<never, never>> = FastifyRequest<T>;

async function getProgram(req: Req<{ Params: { id: string } }>) {
  const program = await publicService.getProgram(req.params.id);
  return program ?? notFound("체험 프로그램을 찾을 수 없습니다");
}

export default { getProgram, ... };
```

### 라우트 파일
화살표 함수 + `export default`. 경로·타입 제네릭·config만 담당.

```typescript
const registerAdminRoutes = async (app: FastifyInstance) => {
  app.addHook("preHandler", app.authenticate);
  app.get<{ Params: { id: string } }>("/admin/programs/:id", adminController.getProgram);
};
export default registerAdminRoutes;
```

---

## 이미지 처리 패턴

```typescript
// 1. 쿼리 실행
const rows = await db.query("program", "listPrograms", params);

// 2. 이미지 ID 수집 + bulk fetch
const imgs = await imagesService.getImages(mappers.imageIdsFrom(rows as any[]));

// 3. 매핑
return (rows as any[]).map(r => mappers.mapProgram(r, imgs));
```

- `image_ids` 컬럼은 `text[]` 타입, SQL에서 배열로 반환
- 개별 이미지 ID는 항상 string (`id::text` 캐스트 결과)
- 단일 이미지 컬럼만 있는 경우: `mappers.singleImageIdsFrom(rows)`

---

## 로깅

- 로그 파일 경로: `D:\workspace\ok2020\log\anduck\`
- 당일: `anduck.log` / 이전 날짜: `anduck.YYYYMMDD.log` / 보관 30일
- 파일 포맷: `[2026-06-16 15:40:05.219] INFO: message` (로컬 현지시간)
- dev 실행: `tsx watch src/index.ts | pino-pretty --colorize --ignore pid,hostname`
