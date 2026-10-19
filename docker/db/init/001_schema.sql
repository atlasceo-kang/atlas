CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('director','teacher','student','parent')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  teacher_id uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE enrollments (
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);
CREATE TABLE parent_student_links (
  parent_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id),
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE assignment_progress (
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  completed_at timestamptz,
  PRIMARY KEY (assignment_id, student_id)
);
CREATE TABLE planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  task_date date NOT NULL,
  title text NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX planner_tasks_student_date_idx ON planner_tasks(student_id, task_date);
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id),
  student_id uuid NOT NULL REFERENCES app_users(id),
  session_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present','late','excused','unexcused')),
  UNIQUE(class_id, student_id, session_date)
);
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES app_users(id),
  class_id uuid REFERENCES classes(id),
  assessment_date date NOT NULL,
  title text NOT NULL,
  score numeric(7,2),
  max_score numeric(7,2),
  CHECK (max_score IS NULL OR max_score > 0),
  CHECK (score IS NULL OR score >= 0)
);
CREATE TABLE consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES app_users(id),
  teacher_id uuid REFERENCES app_users(id),
  consulted_at timestamptz NOT NULL,
  notes text NOT NULL
);
