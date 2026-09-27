import { Module } from '@nestjs/common';
import { DeviceModule } from '../device/device.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [DeviceModule],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
