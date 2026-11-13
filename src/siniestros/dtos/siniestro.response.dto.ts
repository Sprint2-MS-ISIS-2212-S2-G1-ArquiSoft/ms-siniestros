import { EstadoSiniestro } from '../enums/estado-siniestro.enum';

/**
 * Forma exacta con la que un siniestro sale por la API. La entidad Siniestro
 * ya serializa estos mismos campos; este DTO existe para documentar el
 * contrato que consume ms-distribucion (ver su src/clients/siniestros.client.ts).
 */
export class SiniestroResponseDto {
  id!: string;
  descripcionEvento!: string;
  /** numeric(12,2) como string. */
  montoReclamado!: string;
  estado!: EstadoSiniestro;
  polizaId!: string;
  numeroPoliza!: string;
}
