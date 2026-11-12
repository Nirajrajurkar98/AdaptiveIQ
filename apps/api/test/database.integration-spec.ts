import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedDemoData } from '../prisma/seed';

const connectionString = process.env.DATABASE_URL;
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : undefined;

describe('PostgreSQL schema and development seed', () => {
  beforeAll(async () => {
    if (!prisma) throw new Error('DATABASE_URL is required for database integration tests');
    await prisma.$connect();
  });
  afterAll(async () => { await prisma?.$disconnect(); });

  it('inserts stable demo data when the seed runs repeatedly', async () => {
    const database = prisma!;
    await seedDemoData(database);
    await seedDemoData(database);

    const college = await database.college.findUnique({ where: { slug: 'sanjivani-demo' } });
    expect(college).not.toBeNull();
    expect(await database.department.count({ where: { collegeId: college!.id } })).toBe(2);
    expect(await database.academicYear.count({ where: { collegeId: college!.id } })).toBe(2);
    expect(await database.class.count({ where: { collegeId: college!.id } })).toBe(2);
    expect(await database.section.count({ where: { collegeId: college!.id } })).toBe(2);
    expect(await database.subject.count({ where: { collegeId: college!.id } })).toBe(3);
    expect(await database.teacherAssignment.count({ where: { collegeId: college!.id } })).toBe(2);
    expect(await database.studentEnrollment.count({ where: { collegeId: college!.id } })).toBe(3);
    expect(await database.collegeMembership.count({ where: { collegeId: college!.id } })).toBe(7);
  });

  it('runs a real database health query', async () => {
    await expect(prisma!.$queryRaw`SELECT 1`).resolves.toEqual([{ '?column?': 1 }]);
  });

  it('rejects an academic year whose department belongs to another college', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [collegeA, collegeB] = await Promise.all([
      prisma!.college.create({ data: { name: `Constraint A ${suffix}`, slug: `constraint-a-${suffix}` } }),
      prisma!.college.create({ data: { name: `Constraint B ${suffix}`, slug: `constraint-b-${suffix}` } }),
    ]);
    const departmentA = await prisma!.department.create({ data: { collegeId: collegeA.id, name: 'Test Department' } });
    await expect(prisma!.academicYear.create({
      data: { collegeId: collegeB.id, departmentId: departmentA.id, name: 'Cross-college year' },
    })).rejects.toMatchObject({ code: 'P2003' });
    await prisma!.college.deleteMany({ where: { id: { in: [collegeA.id, collegeB.id] } } });
  });
});
