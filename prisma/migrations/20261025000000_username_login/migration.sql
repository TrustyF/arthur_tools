-- Rename (not drop + add) so existing accounts keep their login and password.
ALTER TABLE "User" RENAME COLUMN "email" TO "username";
ALTER INDEX "User_email_key" RENAME TO "User_username_key";
