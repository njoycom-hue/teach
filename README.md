# 과외학생 관리 앱

선생님 / 보호자 / 학생 모드를 하나의 앱에서 지원하는 과외 학생 관리 서비스.
설계 배경과 스키마 상세는 [`DESIGN.md`](./DESIGN.md) 참고.

## 구조

```
.
├── DESIGN.md              # 설계 초안 (스택 선정 이유, ERD, 권한 모델)
├── supabase/
│   └── migrations/        # DB 스키마 + RLS 정책 + RPC 함수
└── mobile/                 # Expo(React Native) 앱 (선생님/학생/보호자 3모드)
```

## 기술 스택

- **앱**: Expo (React Native) + TypeScript + Expo Router (파일 기반 라우팅)
- **서버 상태**: TanStack Query
- **백엔드**: Supabase (PostgreSQL + Auth + Row Level Security)
- **인증**: Supabase Auth (이메일/비밀번호) — 역할(`user_roles`)은 가입 시 메타데이터로 설정, 트리거로 자동 프로비저닝

## 시작하기

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor 또는 `supabase db push`로 `supabase/migrations/`의 3개 파일을 순서대로 실행
   - `0001_schema.sql` — 테이블/인덱스
   - `0002_rls.sql` — Row Level Security 정책
   - `0003_functions.sql` — 회원가입 자동 프로비저닝 트리거, 초대코드 참여 RPC
3. 프로젝트 설정에서 `Project URL`, `anon public key` 확인

### 2. 앱 실행

```bash
cd mobile
npm install
cp .env.example .env   # EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 채우기
npm run start           # Expo Go 앱으로 QR 스캔, 또는 --android / --ios / --web
```

## 사용 흐름 (MVP)

1. **선생님**: 회원가입(역할: 선생님) → 대시보드에서 "새 반 만들기" → 발급된 초대코드를 학생에게 공유 → 반 상세 화면에서 오늘의 목표 등록
2. **학생**: 회원가입(역할: 학생) → 선생님에게 받은 초대코드 입력 → "오늘의 목표"에서 완료/건너뛰기 체크, 학습시간 기록 → "나의 통계"에서 주간 그래프 확인
3. **보호자**: 회원가입(역할: 보호자) → 자녀 이메일 입력해 연결 → 자녀의 오늘 현황/주간 통계를 읽기 전용으로 확인

한 계정이 여러 역할을 가질 수 있으며, 이 경우 화면 상단에서 역할 전환이 가능하다.

## 다음 단계

- 출석 관리, 시험 성적 기록 화면
- 학습 인증샷 업로드 (Supabase Storage)
- 푸시 알림 (목표 리마인더, 보호자 리포트)
- 보호자-학생 연결 승인 플로우 (현재는 이메일 입력 시 즉시 연결)
