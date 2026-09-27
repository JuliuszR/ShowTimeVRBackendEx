import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { GroupModule } from './group/group.module';

@Module({
  imports: [DatabaseModule, GroupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
