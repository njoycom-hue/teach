# 과외학생 관리 앱

선생님 / 보호자 / 학생 모드를 하나의 앱에서 지원하는 과외 학생 관리 서비스.
설계 배경과 스키마 상세는 [`DESIGN.md`](./DESIGN.md) 참고.

## 구조

```
.
├── DESIGN.md              # 설계 초안 (스택 선정 이유, ERD, 권한 모델)
├── supabase/
│   ├── migrations/        # DB 스키마 + RLS 정책 + RPC 함수
│   └── functions/         # Edge Function (보호자 리포트 푸시 발송)
└── mobile/                # Expo(React Native) 앱 (선생님/학생/보호자 3모드)
```

## 기술 스택

- **앱**: Expo (React Native) + TypeScript + Expo Router (파일 기반 라우팅)
- **서버 상태**: TanStack Query
- **백엔드**: Supabase (PostgreSQL + Auth + Row Level Security + Storage + Realtime + Edge Functions)
- **인증**: Supabase Auth (이메일/비밀번호) — 역할(`user_roles`)은 가입 시 메타데이터로 설정, 트리거로 자동 프로비저닝
- **알림**: `expo-notifications` (로컬 리마인더 + Expo Push)

## 시작하기

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor 또는 `supabase db push`로 `supabase/migrations/`의 파일을 순서대로 실행
   - `0001_schema.sql` — 테이블/인덱스
   - `0002_rls.sql` — Row Level Security 정책
   - `0003_functions.sql` — 회원가입 자동 프로비저닝 트리거, 초대코드 참여 RPC
   - `0004_storage.sql` — 학습 인증샷용 `study-proofs` 버킷 + RLS
   - `0005_push_tokens.sql` — Expo Push Token 저장 테이블
   - `0006_guardian_approval.sql` — 보호자-학생 연결 승인 절차
   - `0007_recurring_goals.sql` — 반복 목표 템플릿 + 자동 생성 RPC
   - `0008_messages.sql` — 선생님·학생·보호자 메시지 스레드 + Realtime
   - `0009_tuition.sql` — 수업료 관리
3. 프로젝트 설정에서 `Project URL`, `anon public key` 확인
4. (선택) 보호자 일일 리포트 자동 발송을 쓰려면 `supabase/functions/send-daily-guardian-reports`를
   배포하고 Cron으로 스케줄링 — 파일 상단 주석에 배포/스케줄 명령이 적혀있다.
5. (선택) 매일 자정 반복 목표를 서버에서 자동 생성하고 싶다면 `0007_recurring_goals.sql` 하단 주석의
   `pg_cron` 스케줄 명령을 참고해 `generate_recurring_goals_all()`을 스케줄링한다. 앱은 화면 진입 시에도
   당일 목표를 자동 생성하므로 이 크론은 선택사항이다.

### 2. 앱 실행

```bash
cd mobile
npm install
cp .env.example .env   # EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 채우기
npm run start           # Expo Go 앱으로 QR 스캔, 또는 --android / --ios / --web
```

> 원격 푸시(보호자 리포트)는 Expo Go가 아닌 [개발 빌드](https://docs.expo.dev/develop/development-builds/introduction/)에서만 동작한다 (Expo Go는 SDK 53부터 원격 푸시 미지원). 목표 리마인더 같은 로컬 알림과 메시지 실시간 갱신(Supabase Realtime)은 Expo Go에서도 정상 동작한다.

## 사용 흐름

1. **선생님**: 회원가입(역할: 선생님) → 대시보드에서 "새 반 만들기" → 발급된 초대코드를 학생에게 공유 → 반 상세 화면에서 오늘의 목표 등록(1회성/요일 반복), 출석 체크, 시험 성적 입력, 수업료 등록/완납 처리, 학생과 메시지
2. **학생**: 회원가입(역할: 학생) → 선생님에게 받은 초대코드 입력 → "오늘의 목표"에서 완료/건너뛰기 체크(사진으로 인증 가능), 학습시간 기록, 보호자 연결 요청 승인/거절 → "출결·성적" 탭에서 출결/성적/수업료 확인 → "메시지" 탭에서 선생님과 대화 → "나의 통계"에서 주간 그래프 및 리마인더 알림 설정
3. **보호자**: 회원가입(역할: 보호자) → 자녀 이메일 입력해 연결 요청 → 학생이 승인하면 자녀의 오늘 현황/주간 통계/출결/성적/수업료를 읽기 전용으로 확인, 담당 선생님과 메시지

한 계정이 여러 역할을 가질 수 있으며, 이 경우 화면 상단에서 역할 전환이 가능하다.

## 구현된 기능

- 역할별(선생님/보호자/학생) 인증 및 네비게이션, 역할 전환
- **내 목표**: 학생이 선생님 배정과 무관하게 스스로 정하는 개인 목표(완전 비공개) — 자기주도 학습의 핵심
- **학습 타이머**: 숫자 직접 입력 대신 스톱워치로 실제 학습시간을 측정해 자동 기록
- 반(Classroom) 생성 및 초대코드로 학생 참여
- 목표(계획) 생성(반 전체/개인, 날짜 지정) 및 완료 체크, 사진 인증, 이번 주 계획 한눈에 보기
- 요일별 반복 목표 템플릿 — 화면 진입 시 당일 목표 자동 생성
- 출석 체크(선생님) / 출석 이력 조회(학생·보호자)
- 시험 성적 등록(선생님) / 성적 이력 조회(학생·보호자)
- 수업료 등록·완납 처리(선생님) / 납부 현황 조회(학생·보호자)
- 실시간 메시지 — 반+학생 단위 스레드에 선생님·학생·승인된 보호자가 함께 참여(Supabase Realtime)
- 주간 통계(달성률, 연속일수, 학습시간) 시각화
- 보호자-학생 연결 승인/거절 플로우
- 목표 리마인더 로컬 알림, 보호자 리포트용 푸시 인프라(Edge Function)

## 다음 단계

- 목표 반복 생성을 서버 크론으로 완전 자동화(현재는 화면 진입 시 생성 + 선택적 크론)
- 메시지 읽음 표시 UI, 안 읽은 메시지 배지
- 수업료 결제 연동(PG사 연동, 카드/계좌이체)
