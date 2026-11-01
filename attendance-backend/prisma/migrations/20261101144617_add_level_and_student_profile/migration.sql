/*
  Warnings:

  - A unique constraint covering the columns `[level,grade,room,academicYear]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SchoolLevel" AS ENUM ('KINDERGARTEN', 'PRIMARY');

-- DropIndex
DROP INDEX "Classroom_grade_room_academicYear_key";

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "level" "SchoolLevel" NOT NULL DEFAULT 'PRIMARY';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "prefix" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_level_grade_room_academicYear_key" ON "Classroom"("level", "grade", "room", "academicYear");
