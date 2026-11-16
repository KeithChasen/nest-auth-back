import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Make ConfigModule global for entire app
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // set up DB asyncronously, to let it first read .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true, // load all Entity automatically
        synchronize: true, // automatically create tables in DB (for dev only)
      }),
    }),
    UsersModule,
  ],
})
export class AppModule {}
