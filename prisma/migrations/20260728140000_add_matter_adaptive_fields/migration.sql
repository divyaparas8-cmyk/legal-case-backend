-- AlterTable
ALTER TABLE `matters` ADD COLUMN `parties_data` JSON NULL,
                      ADD COLUMN `vehicles_data` JSON NULL,
                      ADD COLUMN `intake_answers` JSON NULL;
