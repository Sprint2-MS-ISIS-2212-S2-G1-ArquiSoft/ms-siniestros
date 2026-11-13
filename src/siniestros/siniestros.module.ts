import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Siniestro } from './entities/siniestro.entity';
import { SiniestrosController } from './siniestros.controller';
import { SiniestrosService } from './siniestros.service';

/**
 * Dominio de Siniestros: registro y consulta del estado de siniestros.
 *
 * El CacheModule con Redis y TTL de 60 s que el monolito registraba aqui NO se
 * migra: es tactica del ASR de Siniestros y se agrega despues, en su rama.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Siniestro])],
  controllers: [SiniestrosController],
  providers: [SiniestrosService],
  exports: [SiniestrosService],
})
export class SiniestrosModule {}
