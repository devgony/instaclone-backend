/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[photoId,userId]` on the table `like`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "like.photoId_userId_unique" ON "like"("photoId", "userId");
