import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseCollection } from '../database/database-collection.enum';
import { DatabaseService } from '../database/database.service';
import { Device } from './models/device.model';

@Injectable()
export class DeviceService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Device[]> {
    return this.databaseService.getCollection<Device>(DatabaseCollection.Devices);
  }

  async findById(id: number): Promise<Device> {
    const devices = await this.findAll();
    const device = devices.find((candidate) => candidate.id === id);
    if (!device) {
      throw new NotFoundException(`Device with id ${id} not found`);
    }
    return device;
  }

  async findManyById(ids: readonly number[]): Promise<Device[]> {
    const uniqueIds = [...new Set(ids)];
    return Promise.all(uniqueIds.map((id) => this.findById(id)));
  }
}
