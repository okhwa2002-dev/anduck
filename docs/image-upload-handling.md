# Image Upload Handling

> 앞으로 이미지 업로드 기능을 구현하거나 수정할 때의 규칙은 `.claude/roles/image-upload.md`를 우선 따른다.

이미지 업로드와 대표 이미지 처리 방식은 특정 관리 화면에 한정하지 않고, 이미지 업로드를 사용하는 모든 기능에 동일하게 적용한다.

## 1. 공통 데이터 구조

이미지를 여러 장 등록할 수 있는 콘텐츠는 다음 구조를 사용한다.

```ts
mainImageId?: string;
imageIds?: string[];
```

- `imageIds`: 콘텐츠에 등록된 전체 이미지 ID 목록
- `mainImageId`: 대표 이미지로 사용할 이미지 ID

API 응답에서는 일반적으로 다음 형태로 내려온다.

```ts
mainImage?: ImageRef;
images: ImageRef[];
```

## 2. 공통 업로드 컴포넌트

파일:

- `apps/web/src/components/common/ImageUploader.tsx`

동작:

- 이미지를 업로드하면 `images` 목록에 추가한다.
- 대표 이미지가 아직 없으면 첫 번째 업로드 이미지를 자동 대표 이미지로 지정한다.
- 각 썸네일 아래에 `대표로 지정` 버튼을 항상 표시한다.
- 현재 대표 이미지는 `대표 이미지`로 표시한다.
- 삭제 버튼은 이미지 우측 상단에 표시한다.

## 3. 저장 요청 규칙

이미지 업로드를 사용하는 화면은 저장 시 다음 값을 API로 전달한다.

```ts
{
  mainImageId,
  imageIds: images.map((img) => img.id)
}
```

## 4. 대표 이미지 삭제 규칙

대표 이미지로 지정된 이미지를 삭제한 경우 다음 규칙을 따른다.

- 삭제된 이미지는 `imageIds`에서 제거한다.
- 삭제된 이미지가 대표 이미지였다면 다음 이미지가 있으면 자동으로 대표 이미지가 된다.
- 다음 이미지가 없으면 `mainImageId`는 비워진다.
- API는 `imageIds`가 전달됐고 `mainImageId`가 없으면 DB의 대표 이미지 컬럼을 `NULL`로 갱신해야 한다.

이 처리가 없으면 이미지 목록에는 없는데 대표 이미지 ID만 DB에 남는 문제가 생긴다.

## 5. 적용된 화면

현재 적용된 화면:

- 시설관리 등록/수정
  - `apps/web/src/view/admin/facilities/FormPage.tsx`
  - API 처리: `apps/api/src/services/adminService.ts`

추가로 이미지 업로드를 사용하는 화면이 생기면 같은 규칙을 적용한다.

## 6. API 구현 시 주의사항

수정 API에서는 `undefined`와 `NULL`의 의미를 구분해야 한다.

- `undefined`: 해당 필드를 변경하지 않음
- `NULL`: 해당 필드를 DB에서 비움

예시:

```ts
mainImageId: body.mainImageId !== undefined
  ? utils.pgId(body.mainImageId)
  : body.imageIds !== undefined
    ? "NULL"
    : null
```

## 7. 검증

```bash
pnpm --filter @anduck/web typecheck
pnpm --filter @anduck/api typecheck
```

API 서버 재시작 후 다시 저장하면 대표 이미지 삭제 상태가 DB에도 반영된다.

## 8. 업로드 보안 강화

업로드 API는 다음 검증을 수행한다.

- 허용 MIME: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- 최대 파일 크기: 10MB
- rate limit: 30회 / 1분
- 관리자 권한 검증
- CSRF 검증
- magic byte 기반 실제 이미지 형식 검증
- MIME, 확장자, 실제 이미지 형식 불일치 차단
- UUID 기반 저장 파일명 사용

관련 파일:

- `apps/api/src/routes/filesRoutes.ts`
- `apps/api/src/services/filesService.ts`
