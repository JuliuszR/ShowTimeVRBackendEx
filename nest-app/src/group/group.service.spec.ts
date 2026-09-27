import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { Device } from '../device/models/device.model';
import { DeviceService } from '../device/device.service';
import { Group } from './models/group.model';
import { GroupService } from './group.service';

describe('GroupService', () => {
  let service: GroupService;
  let databaseService: jest.Mocked<Pick<DatabaseService, 'getCollection' | 'saveCollection'>>;
  let deviceService: jest.Mocked<Pick<DeviceService, 'findById' | 'findManyById'>>;

  const devices: Device[] = [
    { id: 1, files: ['a.txt', 'b.txt'] },
    { id: 2, files: ['b.txt', 'c.txt'] },
  ];

  let groups: Group[];

  beforeEach(async () => {
    groups = [{ id: 1, name: 'existing', devices: [1] }];

    databaseService = {
      getCollection: jest.fn().mockImplementation(async () => groups),
      saveCollection: jest.fn().mockImplementation(async (_collection, data) => {
        groups = data as Group[];
      }),
    };

    deviceService = {
      findById: jest.fn().mockImplementation(async (id: number) => {
        const device = devices.find((candidate) => candidate.id === id);
        if (!device) {
          throw new NotFoundException();
        }
        return device;
      }),
      findManyById: jest.fn().mockImplementation(async (ids: readonly number[]) =>
        [...new Set(ids)].map((id) => {
          const device = devices.find((candidate) => candidate.id === id);
          if (!device) {
            throw new NotFoundException();
          }
          return device;
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: DatabaseService, useValue: databaseService },
        { provide: DeviceService, useValue: deviceService },
      ],
    }).compile();

    service = module.get(GroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addDeviceToGroup', () => {
    it('creates a new group when groupName does not exist yet', async () => {
      const result = await service.addDeviceToGroup(2, { groupName: 'brand-new' });

      expect(result).toMatchObject({ name: 'brand-new', devices: [2] });
      expect(groups).toHaveLength(2);
    });

    it('adds the device to an existing group found by id', async () => {
      const result = await service.addDeviceToGroup(2, { groupId: 1 });

      expect(result.devices).toEqual([1, 2]);
    });

    it('is idempotent when the device is already in the group', async () => {
      const result = await service.addDeviceToGroup(1, { groupId: 1 });

      expect(result.devices).toEqual([1]);
    });

    it('reuses the existing group instead of creating a duplicate by name', async () => {
      await service.addDeviceToGroup(2, { groupName: 'existing' });

      expect(groups).toHaveLength(1);
      expect(groups[0]).toMatchObject({ name: 'existing', devices: [1, 2] });
    });

    it('throws NotFoundException when groupId does not exist', async () => {
      await expect(service.addDeviceToGroup(2, { groupId: 999 })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the device does not exist', async () => {
      await expect(service.addDeviceToGroup(999, { groupName: 'brand-new' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('removeDeviceFromGroup', () => {
    it('removes the device and deletes the group once it is empty', async () => {
      const result = await service.removeDeviceFromGroup(1, { groupId: 1 });

      expect(result.devices).toEqual([]);
      expect(groups).toHaveLength(0);
    });

    it('keeps the group when other devices remain', async () => {
      groups = [{ id: 1, name: 'existing', devices: [1, 2] }];

      const result = await service.removeDeviceFromGroup(1, { groupName: 'existing' });

      expect(result.devices).toEqual([2]);
      expect(groups).toHaveLength(1);
    });

    it('throws NotFoundException for an unknown group', async () => {
      await expect(service.removeDeviceFromGroup(1, { groupId: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listFilesForGroups', () => {
    it('returns a deduplicated list of files across the given groups', async () => {
      groups = [
        { id: 1, name: 'g1', devices: [1] },
        { id: 2, name: 'g2', devices: [2] },
      ];

      const result = await service.listFilesForGroups([{ groupId: 1 }, { groupId: 2 }]);

      expect(result.sort()).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });

    it('throws NotFoundException for an unknown group', async () => {
      await expect(service.listFilesForGroups([{ groupName: 'missing' }])).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
