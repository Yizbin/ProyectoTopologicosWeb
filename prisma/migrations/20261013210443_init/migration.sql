-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `contrasena` VARCHAR(191) NOT NULL,
    `rol` ENUM('CLIENTE', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',

    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sedes` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `telefonoActivo` VARCHAR(191) NOT NULL,
    `horaAperturaGeneral` VARCHAR(191) NOT NULL,
    `horaCierreGeneral` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `espacios` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `tipo` ENUM('Sala', 'Cubiculo', 'PC') NOT NULL,
    `costoPorHora` DOUBLE NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `duracionMinutos` INTEGER NOT NULL,
    `sedeId` VARCHAR(191) NOT NULL,
    `capacidadMaxima` INTEGER NOT NULL,
    `amenidades` JSON NOT NULL,
    `minimoHorasReserva` INTEGER NOT NULL,
    `maximoHorasReserva` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horarios_atencion` (
    `id` VARCHAR(191) NOT NULL,
    `diaSemana` INTEGER NOT NULL,
    `horaApertura` VARCHAR(191) NOT NULL,
    `horaCierre` VARCHAR(191) NOT NULL,
    `espacioId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloqueos` (
    `id` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFin` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `espacioId` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` VARCHAR(191) NOT NULL,
    `montoTotal` DOUBLE NOT NULL,
    `estado` ENUM('PENDIENTE', 'COMPLETADO', 'REEMBOLSADO') NOT NULL DEFAULT 'PENDIENTE',
    `metodo` ENUM('EFECTIVO', 'TARJETA') NULL,
    `referencia` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservaciones` (
    `id` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFin` VARCHAR(191) NOT NULL,
    `estado` ENUM('pendiente', 'confirmada', 'cancelada', 'completada') NOT NULL DEFAULT 'pendiente',
    `espacioId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `pagoId` VARCHAR(191) NULL,
    `cantidadPersonas` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,

    UNIQUE INDEX `reservaciones_pagoId_key`(`pagoId`),
    INDEX `reservaciones_espacioId_fecha_idx`(`espacioId`, `fecha`),
    INDEX `reservaciones_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `espacios` ADD CONSTRAINT `espacios_sedeId_fkey` FOREIGN KEY (`sedeId`) REFERENCES `sedes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horarios_atencion` ADD CONSTRAINT `horarios_atencion_espacioId_fkey` FOREIGN KEY (`espacioId`) REFERENCES `espacios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloqueos` ADD CONSTRAINT `bloqueos_espacioId_fkey` FOREIGN KEY (`espacioId`) REFERENCES `espacios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservaciones` ADD CONSTRAINT `reservaciones_espacioId_fkey` FOREIGN KEY (`espacioId`) REFERENCES `espacios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservaciones` ADD CONSTRAINT `reservaciones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservaciones` ADD CONSTRAINT `reservaciones_pagoId_fkey` FOREIGN KEY (`pagoId`) REFERENCES `pagos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
