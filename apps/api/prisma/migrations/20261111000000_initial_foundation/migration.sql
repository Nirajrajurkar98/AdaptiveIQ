CREATE TYPE "CollegeRole" AS ENUM ('PLATFORM_ADMIN', 'COLLEGE_ADMIN', 'TEACHER', 'STUDENT');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollegeMembership" (
    "userId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "role" "CollegeRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollegeMembership_pkey" PRIMARY KEY ("userId", "collegeId")
);

CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3),
    "endsOn" TIMESTAMP(3),
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeacherProfile" (
    "userId" TEXT NOT NULL,
    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "StudentProfile" (
    "userId" TEXT NOT NULL,
    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentEnrollment" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "College_slug_key" ON "College"("slug");
CREATE INDEX "CollegeMembership_collegeId_role_idx" ON "CollegeMembership"("collegeId", "role");
CREATE UNIQUE INDEX "Department_id_collegeId_key" ON "Department"("id", "collegeId");
CREATE UNIQUE INDEX "Department_collegeId_name_key" ON "Department"("collegeId", "name");
CREATE INDEX "Department_collegeId_idx" ON "Department"("collegeId");
CREATE UNIQUE INDEX "AcademicYear_id_collegeId_departmentId_key" ON "AcademicYear"("id", "collegeId", "departmentId");
CREATE UNIQUE INDEX "AcademicYear_departmentId_name_key" ON "AcademicYear"("departmentId", "name");
CREATE INDEX "AcademicYear_collegeId_departmentId_idx" ON "AcademicYear"("collegeId", "departmentId");
CREATE UNIQUE INDEX "Class_id_collegeId_departmentId_academicYearId_key" ON "Class"("id", "collegeId", "departmentId", "academicYearId");
CREATE UNIQUE INDEX "Class_academicYearId_name_key" ON "Class"("academicYearId", "name");
CREATE INDEX "Class_collegeId_departmentId_academicYearId_idx" ON "Class"("collegeId", "departmentId", "academicYearId");
CREATE UNIQUE INDEX "Section_id_collegeId_departmentId_academicYearId_classId_key" ON "Section"("id", "collegeId", "departmentId", "academicYearId", "classId");
CREATE UNIQUE INDEX "Section_classId_name_key" ON "Section"("classId", "name");
CREATE INDEX "Section_collegeId_departmentId_academicYearId_classId_idx" ON "Section"("collegeId", "departmentId", "academicYearId", "classId");
CREATE UNIQUE INDEX "Subject_id_collegeId_departmentId_academicYearId_key" ON "Subject"("id", "collegeId", "departmentId", "academicYearId");
CREATE UNIQUE INDEX "Subject_collegeId_academicYearId_code_key" ON "Subject"("collegeId", "academicYearId", "code");
CREATE INDEX "Subject_collegeId_departmentId_academicYearId_idx" ON "Subject"("collegeId", "departmentId", "academicYearId");
CREATE UNIQUE INDEX "TeacherAssignment_teacherUserId_sectionId_subjectId_key" ON "TeacherAssignment"("teacherUserId", "sectionId", "subjectId");
CREATE INDEX "TeacherAssignment_collegeId_departmentId_academicYearId_classId_sectionId_subjectId_idx" ON "TeacherAssignment"("collegeId", "departmentId", "academicYearId", "classId", "sectionId", "subjectId");
CREATE UNIQUE INDEX "StudentEnrollment_studentUserId_sectionId_key" ON "StudentEnrollment"("studentUserId", "sectionId");
CREATE INDEX "StudentEnrollment_collegeId_departmentId_academicYearId_classId_sectionId_idx" ON "StudentEnrollment"("collegeId", "departmentId", "academicYearId", "classId", "sectionId");

ALTER TABLE "CollegeMembership" ADD CONSTRAINT "CollegeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollegeMembership" ADD CONSTRAINT "CollegeMembership_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_departmentId_collegeId_fkey" FOREIGN KEY ("departmentId", "collegeId") REFERENCES "Department"("id", "collegeId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_collegeId_departmentId_fkey" FOREIGN KEY ("academicYearId", "collegeId", "departmentId") REFERENCES "AcademicYear"("id", "collegeId", "departmentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_collegeId_departmentId_academicYearId_fkey" FOREIGN KEY ("classId", "collegeId", "departmentId", "academicYearId") REFERENCES "Class"("id", "collegeId", "departmentId", "academicYearId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_academicYearId_collegeId_departmentId_fkey" FOREIGN KEY ("academicYearId", "collegeId", "departmentId") REFERENCES "AcademicYear"("id", "collegeId", "departmentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherUserId_collegeId_fkey" FOREIGN KEY ("teacherUserId", "collegeId") REFERENCES "CollegeMembership"("userId", "collegeId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "TeacherProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_sectionId_collegeId_departmentId_academicYearId_classId_fkey" FOREIGN KEY ("sectionId", "collegeId", "departmentId", "academicYearId", "classId") REFERENCES "Section"("id", "collegeId", "departmentId", "academicYearId", "classId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_collegeId_departmentId_academicYearId_fkey" FOREIGN KEY ("subjectId", "collegeId", "departmentId", "academicYearId") REFERENCES "Subject"("id", "collegeId", "departmentId", "academicYearId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_collegeId_departmentId_academicYearId_fkey" FOREIGN KEY ("classId", "collegeId", "departmentId", "academicYearId") REFERENCES "Class"("id", "collegeId", "departmentId", "academicYearId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentUserId_collegeId_fkey" FOREIGN KEY ("studentUserId", "collegeId") REFERENCES "CollegeMembership"("userId", "collegeId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_sectionId_collegeId_departmentId_academicYearId_classId_fkey" FOREIGN KEY ("sectionId", "collegeId", "departmentId", "academicYearId", "classId") REFERENCES "Section"("id", "collegeId", "departmentId", "academicYearId", "classId") ON DELETE CASCADE ON UPDATE CASCADE;
