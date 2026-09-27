import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseCollection } from '../database/database-collection.enum';
import { DatabaseService } from '../database/database.service';
import { DeviceService } from './device.service';
import { Device } from './models/device.model';

describe('DeviceService', () => {
  let service: DeviceService;
  let databaseService: jest.Mocked<Pick<DatabaseService, 'getCollection'>>;

  const devices: Device[] = [
    { id: 1, files: ['a.txt', 'b.txt'] },
    { id: 2, files: ['b.txt', 'c.txt'] },
  ];

  beforeEach(async () => {
    databaseService = { getCollection: jest.fn().mockResolvedValue(devices) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceService, { provide: DatabaseService, useValue: databaseService }],
    }).compile();

    service = module.get(DeviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns all devices from the devices collection', async () => {
    await expect(service.findAll()).resolves.toEqual(devices);
    expect(databaseService.getCollection).toHaveBeenCalledWith(DatabaseCollection.Devices);
  });

  it('returns a device by id', async () => {
    await expect(service.findById(2)).resolves.toEqual(devices[1]);
  });

  it('throws NotFoundException for an unknown id', async () => {
    await expect(service.findById(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deduplicates ids when finding many devices', async () => {
    const result = await service.findManyById([1, 1, 2]);
    expect(result).toEqual([devices[0], devices[1]]);
  });
});
