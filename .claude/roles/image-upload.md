# Image Upload Rules

이미지 업로드 기능을 새로 만들거나 수정할 때 반드시 따르는 공통 규칙이다.

## 공통 데이터 구조

여러 이미지를 등록할 수 있는 콘텐츠는 다음 필드를 사용한다.

```ts
mainImageId?: string;
imageIds?: string[];
```

- `imageIds`: 콘텐츠에 연결된 전체 이미지 ID 목록
- `mainImageId`: 대표 이미지 ID

조회 응답은 다음 구조를 사용한다.

```ts
mainImage?: ImageRef;
images: ImageRef[];
```

## 프론트 구현 규칙

- 공통 컴포넌트 `ImageUploader`를 사용한다.
- 업로드 성공 시 `images` 목록에 추가한다.
- 대표 이미지가 없으면 첫 번째 업로드 이미지를 자동 대표 이미지로 지정한다.
- 각 썸네일에는 `대표로 지정` 버튼을 항상 보여준다.
- 현재 대표 이미지는 `대표 이미지`로 명확하게 표시한다.
- 삭제 버튼은 이미지마다 제공한다.
- 저장 요청에는 항상 다음 값을 포함한다.

```ts
{
  mainImageId,
  imageIds: images.map((img) => img.id)
}
```

## 대표 이미지 삭제 규칙

대표 이미지로 지정된 이미지를 삭제한 경우:

- 삭제된 이미지는 `imageIds`에서 제거한다.
- 남은 이미지가 있으면 첫 번째 이미지를 새 대표 이미지로 지정한다.
- 남은 이미지가 없으면 `mainImageId`는 비운다.
- API는 `imageIds`가 전달됐고 `mainImageId`가 없으면 DB의 대표 이미지 컬럼을 `NULL`로 갱신해야 한다.

이 규칙을 지키지 않으면 이미지 목록에는 없는데 `main_image_id`만 DB에 남는 문제가 생긴다.

## API 구현 규칙

수정 API에서는 `undefined`와 `NULL`의 의미를 구분한다.

- `undefined`: 필드를 변경하지 않음
- `NULL`: DB 필드를 비움

예시:

```ts
mainImageId: body.mainImageId !== undefined
  ? utils.pgId(body.mainImageId)
  : body.imageIds !== undefined
    ? "NULL"
    : null
```

mapper에서는 `mainImageId` 값이 `"NULL"`일 때 `main_image_id = NULL`이 실행되도록 raw SQL substitution을 사용한다.

## 업로드 API 규칙

- 업로드 API: `POST /files/images?source={menuCode}`
- `source`에는 현재 메뉴 코드가 있으면 전달한다.
- API는 MIME, 파일 크기, rate limit, 관리자 권한, CSRF를 검증한다.
- API는 magic byte를 검사해 실제 이미지 파일인지 확인한다.
- MIME, 확장자, 실제 이미지 형식이 일치하지 않으면 저장하지 않는다.
- 파일 메타데이터는 `image` 테이블에 저장한다.
- 콘텐츠 테이블은 `main_image_id`, `image_ids`로 이미지를 참조한다.

## 검증

이미지 업로드/대표 이미지 흐름 변경 후 최소한 아래를 실행한다.

```bash
pnpm --filter @anduck/web typecheck
pnpm --filter @anduck/api typecheck
```
