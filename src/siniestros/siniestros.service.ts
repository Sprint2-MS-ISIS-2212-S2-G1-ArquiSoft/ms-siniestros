import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Siniestro } from './entities/siniestro.entity';

@Injectable()
export class SiniestrosService {
  constructor(
    @InjectRepository(Siniestro)
    private readonly siniestroRepository: Repository<Siniestro>,
  ) {}

  /**
   * Siniestros de una poliza. En el monolito esto era un JOIN contra polizas
   * (where: { poliza: { numeroPoliza } }); aqui la columna numeroPoliza esta
   * desnormalizada en la tabla propia, asi que no hace falta ni JOIN ni una
   * llamada HTTP a emision.
   */
  async consultarPorPoliza(numeroPoliza: string): Promise<Siniestro[]> {
    const siniestros = await this.siniestroRepository.find({
      where: { numeroPoliza },
    });
    if (siniestros.length === 0) {
      throw new NotFoundException(
        `No se encontraron siniestros para la póliza ${numeroPoliza}`,
      );
    }
    return siniestros;
  }

  async getSiniestro(idSiniestro: string): Promise<Siniestro> {
    // La columna id es uuid: consultar con un id mal formado revienta en
    // Postgres, asi que un id invalido se trata como inexistente (404).
    if (!isUUID(idSiniestro)) {
      throw new NotFoundException(
        `Siniestro con id ${idSiniestro} no encontrado`,
      );
    }
    const siniestro = await this.siniestroRepository.findOne({
      where: { id: idSiniestro },
    });
    if (!siniestro) {
      throw new NotFoundException(
        `Siniestro con id ${idSiniestro} no encontrado`,
      );
    }
    return siniestro;
  }
}
