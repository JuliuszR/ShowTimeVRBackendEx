import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './models/group.model';

describe('GroupController', () => {
  let controller: GroupController;
  let groupService: jest.Mocked<Pick<GroupService, 'addDeviceToGroup' | 'removeDeviceFromGroup' | 'listFilesForGroups'>>;

  const group: Group = { id: 1, name: 'g1', devices: [1] };

  beforeEach(async () => {
    groupService = {
      addDeviceToGroup: jest.fn().mockResolvedValue(group),
      removeDeviceFromGroup: jest.fn().mockResolvedValue(group),
      listFilesForGroups: jest.fn().mockResolvedValue(['a.txt']),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [{ provide: GroupService, useValue: groupService }],
    }).compile();

    controller = module.get(GroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates adding a device to the service', async () => {
    const dto = { deviceId: 1, groupId: 1 };

    await expect(controller.addDeviceToGroup(dto)).resolves.toEqual(group);
    expect(groupService.addDeviceToGroup).toHaveBeenCalledWith(1, dto);
  });

  it('delegates removing a device to the service', async () => {
    const dto = { deviceId: 1, groupId: 1 };

    await expect(controller.removeDeviceFromGroup(dto)).resolves.toEqual(group);
    expect(groupService.removeDeviceFromGroup).toHaveBeenCalledWith(1, dto);
  });

  it('delegates listing files to the service', async () => {
    const dto = { groups: [{ groupId: 1 }] };

    await expect(controller.getFilesForGroups(dto)).resolves.toEqual(['a.txt']);
    expect(groupService.listFilesForGroups).toHaveBeenCalledWith(dto.groups);
  });
});
