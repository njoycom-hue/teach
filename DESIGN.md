# 과외학생 관리 앱 — 설계 초안

## 1. 개요

과외(개인/그룹 튜터링) 학생을 관리하는 앱. 세 가지 역할(선생님/보호자/학생)이 하나의 앱을 각자의 화면으로 사용하며, 매일의 학습 목표·진행 기록·통계를 공유한다.

### 핵심 사용자 흐름
- **선생님**: 학생 등록, 매일 학습 목표(과제) 부여, 수업/출석 기록, 성적·진도 통계 확인, 보호자에게 리포트 공유
- **학생**: 오늘의 목표 확인, 학습 완료 체크/인증(사진·타이머), 자신의 통계·스트릭 확인
- **보호자**: 자녀의 학습 현황·통계 열람(읽기 중심), 선생님과 메시지/알림 수신, 결제·수업료 확인(선택)

## 2. 역할(Role) 모델

한 계정이 여러 역할을 가질 수 있다 (예: 학생이 여러 선생님에게 배우거나, 보호자가 여러 자녀를 관리).

```
User ──< UserRole >── (TEACHER | GUARDIAN | STUDENT)
```

- **테넌시 단위**: `Classroom`(또는 `TutoringGroup`) — 선생님 1명이 여러 개설 가능, 학생은 여러 Classroom에 소속 가능
- **연결 관계**: `GuardianStudentLink` (보호자-학생 N:M), `TeacherStudentLink`은 Classroom 소속으로 대체
- 로그인은 하나, 앱 진입 시 "모드 선택"이 아니라 **보유 역할에 따라 자동으로 홈 화면 분기** (역할이 2개 이상이면 상단에서 전환 가능한 스위처 제공) — "어떤 모드로 로그인할지 매번 선택"보다 UX가 낫고, 계정 관리가 단순해짐

## 3. 기술 스택 제안

| 영역 | 선택 | 이유 |
|---|---|---|
| 모바일 앱 | **React Native (Expo)** | iOS/Android 동시 대응, 학생/보호자/선생님 앱을 하나의 코드베이스로. 웹 관리자용 코드(React)와 컴포넌트/로직 공유 용이 |
| 상태관리 | React Query(서버 상태) + Zustand(클라이언트 상태) | 통계/목표 등 서버 동기화가 핵심이라 캐싱·리페치 관리가 쉬운 React Query가 유리 |
| 백엔드 | **NestJS (TypeScript)** | 역할 기반 권한(Guard/Decorator), 모듈 구조가 Classroom/Student/Goal 도메인 분리에 적합. 프론트와 언어 통일(TS) |
| API 방식 | REST + 필요시 WebSocket(실시간 알림) | 통계 대시보드는 REST로 충분, 학습 완료 체크/메시지는 실시간이면 좋음 (Socket.IO) |
| DB | **PostgreSQL** | 관계형 데이터(사용자-역할-학생-목표-기록) + 통계 집계(윈도우 함수, 집계 뷰)에 강함. Supabase로 시작하면 Auth+DB+Storage를 한번에 해결 가능 |
| 캐시/큐 | Redis (알림 큐, 세션/랭킹 캐시) | MVP 이후 도입해도 무방 |
| 파일 저장 | S3 호환 스토리지 (Supabase Storage / Cloudflare R2) | 학습 인증샷, 시험지 스캔 등 |
| 인증 | JWT + Refresh Token, 역할별 Custom Claim | 학생은 나이가 어릴 수 있어 보호자 계정으로 학생 생성(초대코드 방식) 고려 |
| 푸시 알림 | Expo Notifications / FCM | "오늘 목표 미완료" 리마인더, 보호자 리포트 알림 |
| 인프라 | Docker + Railway/Fly.io 또는 Supabase(BaaS) | 1인/소규모 개발이면 Supabase로 시작해 백엔드 커스텀 로직만 Edge Function/NestJS로 분리하는 것 추천 |

**MVP를 빠르게 검증하고 싶다면**: NestJS 직접 구축 대신 **Supabase(Postgres + Auth + Storage + Row Level Security)** 로 시작하고, RLS로 역할별 데이터 접근을 제어하는 방법도 매우 적합하다. 팀 규모가 작다면 이 방식을 추천.

## 4. DB 스키마 초안 (PostgreSQL)

```sql
-- 사용자 & 역할
users (
  id UUID PK,
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)

user_roles (
  id UUID PK,
  user_id UUID FK -> users,
  role TEXT CHECK (role IN ('TEACHER','GUARDIAN','STUDENT')),
  UNIQUE(user_id, role)
)

-- 학원/과외 그룹
classrooms (
  id UUID PK,
  teacher_id UUID FK -> users,
  name TEXT,           -- 예: "중2 수학 과외"
  subject TEXT,
  created_at TIMESTAMPTZ
)

classroom_students (
  id UUID PK,
  classroom_id UUID FK -> classrooms,
  student_id UUID FK -> users,
  joined_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('ACTIVE','PAUSED','LEFT'))
)

guardian_student_links (
  id UUID PK,
  guardian_id UUID FK -> users,
  student_id UUID FK -> users,
  relation TEXT        -- 예: "모", "부"
)

-- 목표 & 학습 기록
goals (
  id UUID PK,
  classroom_id UUID FK -> classrooms,
  student_id UUID FK -> users,     -- 특정 학생 개별 목표 (NULL이면 반 전체 공통)
  title TEXT,
  description TEXT,
  target_date DATE,                -- 하루 단위 목표는 target_date = 오늘
  goal_type TEXT CHECK (goal_type IN ('DAILY','WEEKLY','LONG_TERM')),
  created_by UUID FK -> users,
  created_at TIMESTAMPTZ
)

goal_completions (
  id UUID PK,
  goal_id UUID FK -> goals,
  student_id UUID FK -> users,
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('PENDING','DONE','SKIPPED','LATE')),
  proof_url TEXT,           -- 인증샷 (선택)
  duration_minutes INT,     -- 학습 시간 기록 (선택)
  teacher_feedback TEXT
)

-- 학습 로그 (자유 기록: 오늘 몇 문제 풀었는지 등)
study_logs (
  id UUID PK,
  student_id UUID FK -> users,
  classroom_id UUID FK -> classrooms,
  log_date DATE,
  subject TEXT,
  minutes_studied INT,
  memo TEXT,
  created_at TIMESTAMPTZ
)

-- 출석/수업
attendance (
  id UUID PK,
  classroom_id UUID FK -> classrooms,
  student_id UUID FK -> users,
  session_date DATE,
  status TEXT CHECK (status IN ('PRESENT','ABSENT','LATE')),
  note TEXT
)

-- 시험/성적 (선택 기능)
exam_records (
  id UUID PK,
  student_id UUID FK -> users,
  classroom_id UUID FK -> classrooms,
  exam_name TEXT,
  score NUMERIC,
  max_score NUMERIC,
  exam_date DATE
)

-- 알림
notifications (
  id UUID PK,
  user_id UUID FK -> users,
  type TEXT,               -- GOAL_REMINDER, DAILY_REPORT, MESSAGE 등
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### 통계는 어떻게?
원본 테이블(`goal_completions`, `study_logs`, `attendance`)을 기준으로 **일별/주별 집계 뷰**를 만들어 대시보드에서 조회:

```sql
CREATE MATERIALIZED VIEW student_weekly_stats AS
SELECT
  student_id,
  date_trunc('week', log_date) AS week,
  SUM(minutes_studied) AS total_minutes,
  COUNT(*) FILTER (WHERE status = 'DONE') AS goals_done,
  COUNT(*) AS goals_total
FROM ... -- goal_completions JOIN goals
GROUP BY student_id, week;
```

데이터량이 많지 않은 초기 단계라면 굳이 Materialized View 없이 실시간 쿼리(GROUP BY + 인덱스)로 충분하다. 성능 이슈가 생기면 그때 집계 테이블/뷰로 전환.

## 5. 권한 모델

| 리소스 | 선생님 | 보호자 | 학생 |
|---|---|---|---|
| 목표 생성/수정 | ✅ (자기 Classroom) | ❌ | ❌ |
| 목표 완료 체크 | ✅ | ❌ | ✅ (본인 것만) |
| 통계 조회 | ✅ (자기 학생 전체) | ✅ (자기 자녀만, 읽기전용) | ✅ (본인만) |
| 학생 등록/초대 | ✅ | ✅ (자녀 연결 요청) | — |
| 메시지 발송 | ✅ | ✅ (선생님에게) | ✅ (선생님에게) |

Supabase 사용 시 위 표를 그대로 **Row Level Security 정책**으로 구현 가능 (`auth.uid()` + `user_roles`/`classroom_students` 조인 조건).

## 6. 화면 구조 (모드별)

```
앱 진입
 └─ 역할 1개면 바로 해당 홈, 2개 이상이면 상단 스위처 노출

[선생님 모드]
 ├─ 대시보드 (오늘 미완료 학생 요약, 반별 통계)
 ├─ 학생 목록 / 학생 상세(목표 이력, 통계, 출결)
 ├─ 목표 관리 (반 공통/개별 부여, 반복 설정)
 ├─ 통계 (반 전체 추이, 개인별 비교)
 └─ 메시지/리포트 발송

[학생 모드]
 ├─ 오늘의 목표 (체크리스트 + 완료 인증)
 ├─ 나의 통계 (스트릭, 주간 학습시간 그래프)
 └─ 선생님 메시지함

[보호자 모드]
 ├─ 자녀 선택 (여러 명이면 탭 전환)
 ├─ 자녀의 오늘/주간 현황 (읽기 전용)
 ├─ 통계 리포트
 └─ 선생님과 메시지
```

## 7. MVP 범위 제안 (1차 스코프)

우선순위를 낮춰도 되는 기능(결제, 시험 성적 관리, 실시간 채팅)은 제외하고:

1. 회원가입/로그인 + 역할 연결(초대코드로 학생↔선생님, 보호자↔학생 연결)
2. Classroom + 학생 등록
3. 일일 목표 생성/부여 + 학생 완료 체크
4. 학생/보호자용 통계 대시보드 (완료율, 스트릭, 주간 그래프)
5. 기본 푸시 알림 (목표 리마인더)

2차: 출결 관리, 시험 성적, 인증샷 업로드, 메시지/채팅, 결제 연동.

## 8. 추천 진행 순서

1. Supabase 프로젝트 생성 → 위 스키마로 마이그레이션 작성
2. RLS 정책으로 역할별 접근 제어 구현 (백엔드 커스텀 서버 없이 시작 가능)
3. Expo(React Native) 앱 스캐폴딩, 역할별 네비게이션 스택 분리
4. 목표 생성 → 완료 체크 → 통계 집계까지 수직 슬라이스로 먼저 구현 (MVP 1개 기능을 처음부터 끝까지)
5. 이후 화면/기능 확장

---

이 초안에 맞춰 실제 프로젝트 스캐폴딩(Expo 앱 + Supabase 스키마 마이그레이션 파일)까지 만들어드릴까요, 아니면 특정 항목(예: DB 스키마, 화면 흐름)을 더 구체화할까요?
