--
-- BD Siniestros · esquema y datos semilla del microservicio siniestros.
-- Extraido de database/solventa.sql y database/seed.sql del monolito modular.
-- Solo las tablas que pertenecen a Siniestros: no se replica la llave foranea
-- siniestros."polizaId" -> polizas(id), porque Poliza vive en el
-- microservicio emision. La columna "numeroPoliza" es nueva: dato
-- desnormalizado para resolver el contrato sin JOIN ni llamada a emision.
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

--
-- Name: siniestros_estado_enum; Type: TYPE
--
DO $$
BEGIN
    CREATE TYPE public.siniestros_estado_enum AS ENUM (
        'REPORTADO',
        'EN_ANALISIS',
        'APROBADO',
        'RECHAZADO',
        'INDEMNIZADO'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

--
-- Name: siniestros; Type: TABLE
--
CREATE TABLE IF NOT EXISTS public.siniestros (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "descripcionEvento" character varying NOT NULL,
    "montoReclamado" numeric(12,2) NOT NULL,
    estado public.siniestros_estado_enum NOT NULL,
    "polizaId" uuid NOT NULL,
    "numeroPoliza" character varying NOT NULL,
    CONSTRAINT "PK_61988bad689ada2c1c811f54ccd" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_siniestros_numeroPoliza"
    ON public.siniestros ("numeroPoliza");

--
-- Datos semilla · experimento GDC-CDP-01-L01 del sprint 1.
-- Los dos siniestros de seed.sql, con los uuid de solventa.sql y el
-- "numeroPoliza" ya resuelto desde polizas (POL-001). Ambos son de la misma
-- poliza, que es el caso que ejercita el contrato.
--
INSERT INTO public.siniestros
    (id, "descripcionEvento", "montoReclamado", estado, "polizaId", "numeroPoliza")
VALUES
    ('c94b360a-7c7d-4b74-8007-6a24ca2949c8', 'Daño por accidente vehicular',
     2500000.00, 'REPORTADO', 'a712e1ff-41ab-41fe-9137-a1e3b3807ce5', 'POL-001'),
    ('f2e3ed0a-f5e2-43ef-bd40-84df16e6ebe3', 'Daño en parabrisas',
     850000.00, 'EN_ANALISIS', 'a712e1ff-41ab-41fe-9137-a1e3b3807ce5', 'POL-001')
ON CONFLICT DO NOTHING;
