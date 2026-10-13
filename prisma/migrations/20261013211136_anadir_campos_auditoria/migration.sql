/*
  Warnings:

  - Added the required column `fechaActualizacion` to the `espacios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaActualizacion` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `espacios` ADD COLUMN `fechaActualizacion` DATETIME(3) NOT NULL,
    ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `fechaActualizacion` DATETIME(3) NOT NULL,
    ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
