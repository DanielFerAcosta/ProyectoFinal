# ProyectoFinal — EntrenaWeb

Aplicación web para crear rutinas y realizar sesiones de entrenamiento
con progreso persistente e historial.

## Tecnologías

- Angular.
- TypeScript.
- SCSS.
- Supabase para persistencia y sincronización de sesiones.
- Supabase Realtime para actualizar el progreso entre pestañas.

## Funcionalidades

### Rutinas

- Selección de rutinas con ejercicios.
- Visualización de series y repeticiones.
- Ordenamiento de rutinas por cantidad de ejercicios.

### Entrenamientos

- Inicio de sesiones y recuperación de sesiones pendientes.
- Ejecución secuencial de los ejercicios.
- Guardado del progreso al completar cada ejercicio.
- Recuperación del progreso después de recargar la página.
- Identificación de la sesión mediante un parámetro en la URL.
- Registro de entrenamientos finalizados.
- Consulta de resultados desde el historial.
- Sincronización del progreso entre pestañas.
- Actualización manual del progreso si falla la conexión de tiempo real.

## Estructuras de datos utilizadas en entrenamiento

### Cola — Queue

Organiza los ejercicios pendientes en orden FIFO:
el primer ejercicio que entra es el primero que se realiza.

Al recuperar una sesión, la cola se reconstruye con la copia de
los ejercicios guardada en la sesión y se retiran los ya completados.

### Montículo mínimo — MinHeap

Ordena las rutinas disponibles de menor a mayor cantidad de ejercicios.

La rutina con menos ejercicios se destaca en el selector.
Esta selección no estima duración ni dificultad.

## Organización del código

Los módulos funcionales se encuentran en:

```text
src/app/features/
├── auth/
├── catalog/
├── dashboard/
├── home/
├── routines/
└── training-session/
```

El módulo de entrenamiento incluye el componente de la pantalla,
los modelos, el servicio de persistencia y las estructuras de datos.

## Instalación local

1. Clonar el repositorio.
2. Instalar las dependencias:

```bash
npm ci
```

3. Configurar la conexión con Supabase y preparar la base de datos.
4. Iniciar el servidor de desarrollo:

```bash
npm start
```

## Compilación

```bash
npm run build
```

## Configuración de la base de datos

El módulo de entrenamiento necesita:

- Las tablas utilizadas por los servicios de rutinas y sesiones.
- Las funciones SQL invocadas para iniciar o recuperar sesiones
  y completar ejercicios.
- Las políticas de acceso correspondientes a cada usuario.
- La configuración de Realtime para los cambios de las sesiones.

La URL y las claves de cliente no sustituyen la configuración
de tablas, funciones y permisos.

El SQL necesario para reproducir esta configuración debe mantenerse
versionado junto con el proyecto.

Nunca se debe incluir una clave service_role en el frontend.

## Comprobaciones manuales

### Persistencia

1. Iniciar una sesión.
2. Completar un ejercicio.
3. Esperar a que termine el guardado.
4. Recargar la página.
5. Verificar que se conserva el contador y aparece el siguiente ejercicio.

### Recuperación de una sesión pendiente

1. Abandonar una sesión sin finalizarla.
2. Volver al selector de entrenamiento.
3. Abrir la misma rutina.
4. Verificar que se recupera el progreso.

### Finalización e historial

1. Completar todos los ejercicios.
2. Comprobar que aparece el resultado final.
3. Recargar la misma URL.
4. Verificar que no se inicia otra sesión.
5. Volver al selector y comprobar el historial.

### Sincronización entre pestañas

1. Abrir una sesión de entrenamiento.
2. Copiar la URL completa, incluido el parámetro session.
3. Abrirla en otra pestaña con la misma cuenta.
4. Completar un ejercicio en una de las pestañas.
5. Verificar que la otra actualiza el progreso.

## Alcance

La aplicación permite organizar y registrar entrenamientos.
El ordenamiento por cantidad de ejercicios no constituye una
recomendación personalizada de intensidad, duración o dificultad.
