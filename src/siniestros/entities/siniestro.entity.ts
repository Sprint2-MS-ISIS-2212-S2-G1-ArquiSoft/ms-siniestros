import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoSiniestro } from '../enums/estado-siniestro.enum';

/**
 * Siniestro reportado sobre una poliza.
 *
 * La relacion @ManyToOne hacia Poliza que existia en el monolito se elimino:
 * Poliza vive en el microservicio emision. En su lugar quedan dos columnas:
 *
 * - polizaId: la llave foranea, con el mismo nombre de columna del monolito
 *   ("polizaId"), pero ya sin la restriccion FK hacia polizas(id).
 * - numeroPoliza: dato desnormalizado desde la poliza. Permite responder
 *   GET /siniestros/poliza/:numeroPoliza sin JOIN y sin llamar a emision,
 *   que es justo lo que el monolito hacia con relations: { poliza: true }.
 */
@Entity('siniestros')
export class Siniestro {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  descripcionEvento!: string;

  /** numeric(12,2): viaja como string para no perder precision. */
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  montoReclamado!: string;

  @Column({ type: 'enum', enum: EstadoSiniestro })
  estado!: EstadoSiniestro;

  /** Id de la poliza amparada. El dato completo lo tiene emision. */
  @Column({ type: 'uuid' })
  polizaId!: string;

  /** Numero de poliza desnormalizado: es el criterio de busqueda del contrato. */
  @Index('IDX_siniestros_numeroPoliza')
  @Column()
  numeroPoliza!: string;
}
