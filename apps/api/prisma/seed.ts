import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, CollegeRole } from '../src/generated/prisma/client';

config({ path: resolve(process.cwd(), '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL must be configured to seed the database');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function upsertUser(client: PrismaClient, email: string, displayName: string, role: CollegeRole, collegeId: string): Promise<string> {
  const user = await client.user.upsert({ where: { email }, update: { displayName }, create: { email, displayName } });
  await client.collegeMembership.upsert({
    where: { userId_collegeId: { userId: user.id, collegeId } },
    update: { role }, create: { userId: user.id, collegeId, role },
  });
  return user.id;
}

export async function seedDemoData(client: PrismaClient = prisma): Promise<void> {
  const college = await client.college.upsert({
    where: { slug: 'sanjivani-demo' },
    update: { name: 'Sanjivani College of Engineering (Demo)' },
    create: { slug: 'sanjivani-demo', name: 'Sanjivani College of Engineering (Demo)' },
  });
  const departments = await Promise.all(['Computer Engineering', 'Mechanical Engineering'].map((name) =>
    client.department.upsert({ where: { collegeId_name: { collegeId: college.id, name } }, update: {}, create: { collegeId: college.id, name } }),
  ));

  const createdAt = new Date('2026-06-01T00:00:00.000Z');
  const academicYear = await client.academicYear.upsert({
    where: { departmentId_name: { departmentId: departments[0].id, name: '2026-2027' } }, update: {},
    create: { collegeId: college.id, departmentId: departments[0].id, name: '2026-2027', startsOn: createdAt },
  });
  const classes = await Promise.all(['First Year', 'Second Year'].map((name) =>
    client.class.upsert({ where: { academicYearId_name: { academicYearId: academicYear.id, name } }, update: {},
      create: { collegeId: college.id, departmentId: departments[0].id, academicYearId: academicYear.id, name } }),
  ));
  const sections = await Promise.all(classes.map((classRecord, index) =>
    client.section.upsert({ where: { classId_name: { classId: classRecord.id, name: index === 0 ? 'A' : 'B' } }, update: {},
      create: { collegeId: college.id, departmentId: departments[0].id, academicYearId: academicYear.id, classId: classRecord.id, name: index === 0 ? 'A' : 'B' } }),
  ));

  const mechanicalAcademicYear = await client.academicYear.upsert({
    where: { departmentId_name: { departmentId: departments[1].id, name: '2026-2027' } }, update: {},
    create: { collegeId: college.id, departmentId: departments[1].id, name: '2026-2027', startsOn: createdAt },
  });

  const subjects = await Promise.all([
    ['Programming Fundamentals', 'CS101'], ['Applied Mathematics', 'MA101'], ['Engineering Mechanics', 'ME101'],
  ].map(([name, code], index) => client.subject.upsert({
    where: { collegeId_academicYearId_code: { collegeId: college.id, academicYearId: index === 2 ? mechanicalAcademicYear.id : academicYear.id, code } }, update: {},
    create: { collegeId: college.id, departmentId: index === 2 ? departments[1].id : departments[0].id,
      academicYearId: index === 2 ? mechanicalAcademicYear.id : academicYear.id, name, code },
  })));

  await upsertUser(client, 'platform-admin@adaptiveiq.test', 'Demo Platform Administrator', CollegeRole.PLATFORM_ADMIN, college.id);
  await upsertUser(client, 'college-admin@adaptiveiq.test', 'Demo College Administrator', CollegeRole.COLLEGE_ADMIN, college.id);
  const teacherOne = await upsertUser(client, 'teacher.one@adaptiveiq.test', 'Demo Teacher One', CollegeRole.TEACHER, college.id);
  const teacherTwo = await upsertUser(client, 'teacher.two@adaptiveiq.test', 'Demo Teacher Two', CollegeRole.TEACHER, college.id);
  const students = await Promise.all(['student.one@adaptiveiq.test', 'student.two@adaptiveiq.test', 'student.three@adaptiveiq.test'].map((email, index) =>
    upsertUser(client, email, `Demo Student ${index + 1}`, CollegeRole.STUDENT, college.id),
  ));
  for (const teacherId of [teacherOne, teacherTwo]) {
    await client.teacherProfile.upsert({ where: { userId: teacherId }, update: {}, create: { userId: teacherId } });
  }
  for (const studentId of students) {
    await client.studentProfile.upsert({ where: { userId: studentId }, update: {}, create: { userId: studentId } });
  }

  await client.teacherAssignment.upsert({
    where: { teacherUserId_sectionId_subjectId: { teacherUserId: teacherOne, sectionId: sections[0].id, subjectId: subjects[0].id } },
    update: {}, create: { teacherUserId: teacherOne, collegeId: college.id, departmentId: departments[0].id,
      academicYearId: academicYear.id, classId: classes[0].id, sectionId: sections[0].id, subjectId: subjects[0].id },
  });
  await client.teacherAssignment.upsert({
    where: { teacherUserId_sectionId_subjectId: { teacherUserId: teacherTwo, sectionId: sections[1].id, subjectId: subjects[1].id } },
    update: {}, create: { teacherUserId: teacherTwo, collegeId: college.id, departmentId: departments[0].id,
      academicYearId: academicYear.id, classId: classes[1].id, sectionId: sections[1].id, subjectId: subjects[1].id },
  });
  for (const [index, studentId] of students.entries()) {
    await client.studentEnrollment.upsert({
      where: { studentUserId_sectionId: { studentUserId: studentId, sectionId: sections[index === 0 ? 0 : 1].id } },
      update: {}, create: { studentUserId: studentId, collegeId: college.id, departmentId: departments[0].id,
        academicYearId: academicYear.id, classId: classes[index === 0 ? 0 : 1].id, sectionId: sections[index === 0 ? 0 : 1].id },
    });
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDemoData()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (error: unknown) => {
      await prisma.$disconnect();
      throw error;
    });
}
