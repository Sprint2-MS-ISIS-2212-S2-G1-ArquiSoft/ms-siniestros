import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { SiniestrosModule } from './siniestros/siniestros.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'siniestros'),
        password: config.get<string>('DB_PASSWORD', 'siniestros'),
        database: config.get<string>('DB_NAME', 'siniestros'),
        autoLoadEntities: true,
        synchronize: true,
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),
    SiniestrosModule,
    HealthModule,
  ],
})
export class AppModule {}
