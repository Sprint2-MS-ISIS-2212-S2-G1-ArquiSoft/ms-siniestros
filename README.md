# Solventa · microservicio `siniestros`

ISIS-2212 Arquitecturas de software robustas · Grupo 1 · Sprint 2

**Responsabilidad:** Registro y consulta del estado de siniestros.

| | |
|---|---|
| Nodo de despliegue | EC2 Soporte |
| Llama a | emision (HTTP) — declarado en el diagrama, todavía sin llamadas reales (ver abajo) |
| Lo llaman | distribucion |
| Base de datos | BD Siniestros (RDS PostgreSQL, Multi-AZ) |
| Puerto interno | 3000 |
| Origen en el monolito | `src/modules/siniestros` |

## Correr en local

```bash
cp .env.example .env
npm ci
npm run start:dev
```

El despliegue (docker-compose por nodo EC2), el gateway, los certificados y la documentación de experimentos viven en el repositorio paraguas `Sprint2-MS-ISIS-2212-S2-G1-ArquiSoft/ISIS2212_202620_S2_Grupo1`, rama `sprint-2-microservicios`.

## Correr en local con Docker

```bash
docker compose -f docker-compose.local.yml up -d --build
curl localhost:3003/health
docker compose -f docker-compose.local.yml down
```

`docker-compose.local.yml` es **solo para desarrollo**: levanta este servicio
(host `3003` → contenedor `3000`) y su propio `postgres:16-alpine` (host `5437`
→ contenedor `5432`), que carga `database/init.sql` al crearse.

## API

Todas las respuestas son `application/json`. Ningún endpoint recibe body:
Siniestros es, por ahora, de solo lectura (el módulo del monolito no tenía
ninguna ruta de escritura).

### `GET /health`

Verifica el servicio y la conexión a la BD (`SELECT 1`).

| | |
|---|---|
| Body | — |
| `200` | `{ "status": "ok" }` |
| `503` | `{ "status": "error", "database": "unreachable" }` |

### `GET /siniestros/poliza/:numeroPoliza`

**Este es el contrato que consume `ms-distribucion`** (ver su
`src/clients/siniestros.client.ts`). Era la única ruta pública del módulo
`siniestros` en el monolito; Distribución la reexpone con la misma ruta porque
el socio solo entra por ahí, y la reenvía a este servicio.

| | |
|---|---|
| Param | `numeroPoliza`: número de póliza visible para el cliente |
| Body | — |
| `200` | arreglo de siniestros de esa póliza (nunca vacío) |
| `404` | `{ "message": "No se encontraron siniestros para la póliza <numeroPoliza>", "error": "Not Found", "statusCode": 404 }` |

```bash
curl localhost:3003/siniestros/poliza/POL-001
```

```json
[
  {
    "id": "c94b360a-7c7d-4b74-8007-6a24ca2949c8",
    "descripcionEvento": "Daño por accidente vehicular",
    "montoReclamado": "2500000.00",
    "estado": "REPORTADO",
    "polizaId": "a712e1ff-41ab-41fe-9137-a1e3b3807ce5",
    "numeroPoliza": "POL-001"
  },
  {
    "id": "f2e3ed0a-f5e2-43ef-bd40-84df16e6ebe3",
    "descripcionEvento": "Daño en parabrisas",
    "montoReclamado": "850000.00",
    "estado": "EN_ANALISIS",
    "polizaId": "a712e1ff-41ab-41fe-9137-a1e3b3807ce5",
    "numeroPoliza": "POL-001"
  }
]
```

A diferencia del monolito, la respuesta **no trae la póliza anidada**: trae
`polizaId` y `numeroPoliza` planos. Es la forma que el contrato ya espera.

Nota sobre `montoReclamado`: es `numeric(12,2)` en Postgres y viaja como
**string** para no perder precisión. El consumidor la convierte.

### `GET /siniestros/:id`

Un siniestro por id. No existía en el monolito; se agrega como la lectura
puntual obvia del recurso, con el mismo criterio que `ms-catalogo`.

| | |
|---|---|
| Param | `id`: uuid del siniestro |
| Body | — |
| `200` | el siniestro |
| `404` | `{ "message": "Siniestro con id <id> no encontrado", "error": "Not Found", "statusCode": 404 }` |

Un `id` que no sea uuid también devuelve `404`, no `400`: para quien consume,
cualquier id que no exista se comporta igual.

### Estados

`estado` es uno de `REPORTADO`, `EN_ANALISIS`, `APROBADO`, `RECHAZADO`,
`INDEMNIZADO` (enum `siniestros_estado_enum`, igual que en el monolito).

## Decisión de diseño: `numeroPoliza` desnormalizado

En el monolito, `Siniestro` tenía un `@ManyToOne` hacia `Poliza` y la consulta
se resolvía con un **JOIN**:

```ts
find({ where: { poliza: { numeroPoliza } }, relations: { poliza: true } })
```

`Poliza` vive en `ms-emision`, así que la relación se parte en dos columnas:

| Monolito | Aquí |
|---|---|
| `@ManyToOne(() => Poliza) poliza` (columna `"polizaId"`, FK a `polizas(id)`) | `polizaId: string` — **mismo nombre de columna**, ya sin la restricción FK |
| `poliza.numeroPoliza` (vía JOIN) | `numeroPoliza: string` — columna nueva, varchar **con índice** |

Con `numeroPoliza` guardado aquí, el contrato se resuelve con un
`WHERE "numeroPoliza" = $1` sobre la tabla propia: **sin JOIN y sin llamar a
emision**. El precio es el habitual de la desnormalización: si una póliza
cambiara de número, Siniestros tendría que enterarse. Para el alcance del
sprint el número de póliza es inmutable, así que no hay sincronización.

## Contrato pendiente de `ms-emision`

**No hay ninguno, a propósito.** El diagrama declara `siniestros → emision`,
pero el módulo del monolito **no tiene ningún camino de escritura**:
`SiniestrosService` tenía un solo método (`consultarPorPoliza`) y el controller
una sola ruta, sin `@Post`/`@Patch`, sin `save`/`create` y sin ninguna
validación de póliza. Como la única lectura ya no necesita a Emisión (ver la
decisión de arriba), este servicio no hace hoy ninguna llamada saliente: no hay
`src/clients/emision.client.ts` ni `emision-mock` en el compose.

`EMISION_URL` queda declarada en `.env.example` para cuando aparezca el
registro de siniestros. Ese día, el cliente HTTP deberá llevar timeout y
propagar `X-Socio-Id`, y el contrato a pedirle a `ms-emision` sería algo como
`GET /polizas/numero/:numeroPoliza` → la póliza con su `id`, `estado` y
vigencia, para validar que ampara el evento antes de registrar.

## Tácticas que quedaron fuera

Este repo es el andamio del dominio; las tácticas de los ASRs van después, en
ramas propias:

- **Caché en Redis con TTL de 60 s.** El monolito la tenía dentro de
  `siniestros.module.ts` (`CacheModule` + `@keyv/redis`) y de
  `siniestros.service.ts` (`cacheManager.get`/`set` sobre la clave
  `siniestros:poliza:<numeroPoliza>`). No se migra: es táctica del ASR de
  Siniestros. `ms-distribucion` tampoco la migró de su lado, por lo mismo.
- **Circuit breaker y reintentos** hacia Emisión: no aplican mientras no haya
  llamada saliente.
- **Filtrado por socio.** Un siniestro *sí* es rastreable hasta un socio, pero
  el camino cruza dos microservicios: `siniestros."polizaId"` →
  `polizas."cotizacionId"` (ms-emision) → `cotizaciones."socioDistribucionId"`
  (ms-cotizacion) → `socios_distribucion`. Además, en los datos del
  experimento la póliza `POL-001` tiene `clienteId` y `cotizacionId` en `NULL`,
  así que hoy el camino se corta en el primer salto. Autorizar por socio es
  táctica del ASR de seguridad.
- **mTLS**: lo termina el Nginx del gateway, no este servicio.

## Datos semilla

`database/init.sql` es idempotente y carga los dos siniestros del experimento
**GDC-CDP-01-L01** del sprint 1 (`database/seed.sql` del monolito), con los
uuid reales de `database/solventa.sql` y su `numeroPoliza` ya resuelto a
`POL-001`. Ambos son de la misma póliza, que es el caso que ejercita el
contrato. No se replica la llave foránea hacia `polizas`: esa tabla es de
`ms-emision`.
