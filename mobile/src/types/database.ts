export type AppRole = 'TEACHER' | 'GUARDIAN' | 'STUDENT';

export type GoalType = 'DAILY' | 'WEEKLY' | 'LONG_TERM';
export type GoalCompletionStatus = 'PENDING' | 'DONE' | 'SKIPPED' | 'LATE';
export type ClassroomStudentStatus = 'ACTIVE' | 'PAUSED' | 'LEFT';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  subject: string | null;
  invite_code: string;
  created_at: string;
}

export interface ClassroomStudent {
  id: string;
  classroom_id: string;
  student_id: string;
  status: ClassroomStudentStatus;
  joined_at: string;
}

export interface GuardianStudentLink {
  id: string;
  guardian_id: string;
  student_id: string;
  relation: string | null;
  status: GuardianLinkStatus;
  created_at: string;
}

export interface GoalTemplate {
  id: string;
  classroom_id: string;
  student_id: string | null;
  title: string;
  description: string | null;
  weekdays: number[];
  active: boolean;
  created_by: string;
  created_at: string;
}

export interface Goal {
  id: string;
  classroom_id: string;
  student_id: string | null;
  title: string;
  description: string | null;
  target_date: string;
  goal_type: GoalType;
  created_by: string;
  template_id: string | null;
  created_at: string;
}

export interface GoalCompletion {
  id: string;
  goal_id: string;
  student_id: string;
  status: GoalCompletionStatus;
  completed_at: string | null;
  proof_url: string | null;
  duration_minutes: number | null;
  teacher_feedback: string | null;
  created_at: string;
}

export interface GoalWithCompletion extends Goal {
  goal_completions: GoalCompletion[];
}

export interface StudyLog {
  id: string;
  student_id: string;
  classroom_id: string | null;
  log_date: string;
  subject: string | null;
  minutes_studied: number;
  memo: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  classroom_id: string;
  student_id: string;
  session_date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
}

export interface ExamRecord {
  id: string;
  student_id: string;
  classroom_id: string | null;
  exam_name: string;
  score: number | null;
  max_score: number | null;
  exam_date: string;
  created_at: string;
}

export type GuardianLinkStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  created_at: string;
}

export interface TuitionPayment {
  id: string;
  classroom_id: string;
  student_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  memo: string | null;
  created_by: string;
  created_at: string;
}

export interface PersonalGoal {
  id: string;
  student_id: string;
  title: string;
  target_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  classroom_id: string;
  student_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}
