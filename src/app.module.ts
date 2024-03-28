import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config/dist';
import { VkModule } from 'nestjs-vk';

import { EchoModule } from './bot/echo/echo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserModule } from './main-entities/user/user.module';
import { GameModule } from './main-entities/game/game.module';
import { AfficheModule } from './main-entities/affiche/affiche.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    VkModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        options: {
          pollingGroupId: configService.get<number>('BOT_GROUP_ID'),
          apiMode: 'sequential',
        },
        useSceneManager: true,
        notReplyMessage: true,
        include: [EchoModule],
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: false,
        entities: ['./dist/**/*.entity.js'],
        migrations: ['./dist/**/migrations/*.js'],
        migrationsRun: true,
      }),
      dataSourceFactory: async (options) => {
        return await new DataSource(options).initialize();
      },
    }),
    EchoModule,
    UserModule,
    GameModule,
    AfficheModule
  ],
})
export class AppModule {
}
