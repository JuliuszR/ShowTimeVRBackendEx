import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AddDeviceToGroupDto } from './dto/add-device-to-group.dto';
import { GetFilesForGroupsDto } from './dto/get-files-for-groups.dto';
import { RemoveDeviceFromGroupDto } from './dto/remove-device-from-group.dto';
import { GroupService } from './group.service';
import { Group } from './models/group.model';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('devices')
  @HttpCode(HttpStatus.OK)
  addDeviceToGroup(@Body() dto: AddDeviceToGroupDto): Promise<Group> {
    return this.groupService.addDeviceToGroup(dto.deviceId, dto);
  }

  @Delete('devices')
  @HttpCode(HttpStatus.OK)
  removeDeviceFromGroup(@Body() dto: RemoveDeviceFromGroupDto): Promise<Group> {
    return this.groupService.removeDeviceFromGroup(dto.deviceId, dto);
  }

  @Post('files')
  @HttpCode(HttpStatus.OK)
  getFilesForGroups(@Body() dto: GetFilesForGroupsDto): Promise<string[]> {
    return this.groupService.listFilesForGroups(dto.groups);
  }
}
