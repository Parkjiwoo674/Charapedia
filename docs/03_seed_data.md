# Seed Data

서버 최초 실행 시 `schema.sql`로 삽입되는 초기 데이터.

## 1. users

| id | nickname | email | role |
|----|---------|-------|------|
| 1 | 운영자 | admin@charapedia.com | admin |
| 2 | 소설덕후 | reader1@example.com | user |
| 3 | 회귀물러버 | reader2@example.com | user |

> admin 계정은 seed 단계에서만 role='admin'으로 직접 삽입한다. 회원가입 API로는 admin이 생성되지 않는다.

## 2. works

| id | title | author | created_by |
|----|-------|--------|-----------|
| 1 | 회귀자의 회사생활 | 김작가 | 2 |
| 2 | 던전을 나가는 방법 | 이작가 | 2 |
| 3 | 재벌집 아기 도사 | 박작가 | 3 |

## 3. characters

| id | work_id | name | quote | created_by |
|----|---------|------|-------|-----------|
| 1 | 1 | 김이현 | "이번 생은 절대 실패하지 않는다." | 2 |
| 2 | 1 | 박서준 | "나는 네 편이야." | 2 |
| 3 | 2 | 루카 | "던전은 나가는 게 아니라 정복하는 것." | 3 |
| 4 | 3 | 도현우 | "할아버지, 저 이번엔 제대로 할게요." | 3 |

## 4. likes

| id | user_id | character_id |
|----|---------|--------------|
| 1 | 2 | 3 |
| 2 | 3 | 1 |
| 3 | 3 | 2 |

## 5. reviews

| id | user_id | character_id | content |
|----|---------|--------------|---------|
| 1 | 3 | 1 | 회귀 클리셰인데도 안 질려요 |
| 2 | 2 | 3 | 루카 서사가 미쳤다 |

## 6. reports

초기 시드 데이터 없음. 사용자가 신고하면 자동으로 생성됨.

| 컬럼 | 설명 |
|------|------|
| reason | spam(도배) / copyright(저작권 침해) / abuse(욕설·혐오) / other(기타) |
| status | pending(대기) → resolved(삭제 처리) / dismissed(반려) |

## 7. DB 초기화 방법

```sql
DROP DATABASE charapedia_db;
CREATE DATABASE charapedia_db;
\c charapedia_db
\i /path/to/charapedia-backend/schema.sql
```

```sql
-- admin 계정 직접 부여 (회원가입 후 수동 승격 시)
UPDATE users SET role = 'admin' WHERE email = 'admin@charapedia.com';
```
