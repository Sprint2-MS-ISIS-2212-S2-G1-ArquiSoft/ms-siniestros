import { Controller, Get, Param } from '@nestjs/common';
import { Siniestro } from './entities/siniestro.entity';
import { SiniestrosService } from './siniestros.service';

@Controller('siniestros')
export class SiniestrosController {
  constructor(private readonly siniestrosService: SiniestrosService) {}

  /** Contrato que consume ms-distribucion. */
  @Get('poliza/:numeroPoliza')
  consultarPorPoliza(
    @Param('numeroPoliza') numeroPoliza: string,
  ): Promise<Siniestro[]> {
    return this.siniestrosService.consultarPorPoliza(numeroPoliza);
  }

  /** Sin ParseUUIDPipe a proposito: el 404 lo decide el servicio. */
  @Get(':id')
  getSiniestro(@Param('id') id: string): Promise<Siniestro> {
    return this.siniestrosService.getSiniestro(id);
  }
}
