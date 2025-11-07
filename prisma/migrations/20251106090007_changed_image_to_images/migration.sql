/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrls" TEXT[];
