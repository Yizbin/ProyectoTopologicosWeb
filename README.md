# Sistema de Reservas y Agenda - Avance 01:

Este repositorio contiene la capa de dominio del Sistema de Reservas de espacios de Coworking. El código está desarrollado en TS puro, sin depender de frameworks web, bases de datos ni controladores, cumpliendo con la regla de aislar el modelo de negocio.

## Requisitos Previos
Para ejecutar el programa de prueba necesitas tener instalado:
  Node.js (versión 16 o superior).


Instrucciones de Ejecución

**Clonar el repositorio:**


Instalar dependencias necesarias:

npm install -D tsx

Ejecutar el programa de escenarios:
npx tsx main.ts
Asegurate de estar en la carpeta src


Al ejecutar el comando, la consola imprimirá el flujo de los tres escenarios:

Caso 1: Mostrará un mensaje de éxito indicando que la reservación se creó correctamente dentro de las horas hábiles configuradas.
Caso 2: Mostrará que la regla de negocio impidió la acción, lanzando un EmpalmeReservacionError porque choca con el horario del Escenario 1.
Caso 3: Mostrará que la regla de negocio impidió la acción, lanzando un FueraDeHorarioError por intentar reservar a las 19:00