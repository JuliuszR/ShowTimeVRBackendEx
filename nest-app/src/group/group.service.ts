import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseCollection } from '../database/database-collection.enum';
import { DatabaseService } from '../database/database.service';
import { DeviceService } from '../device/device.service';
import { GroupIdentifierDto } from './dto/group-identifier.dto';
import { Group } from './models/group.model';

@Injectable()
export class GroupService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly deviceService: DeviceService,
  ) {}

  async addDeviceToGroup(deviceId: number, identifier: GroupIdentifierDto): Promise<Group> {
    await this.deviceService.findById(deviceId);

    const groups = await this.getGroups();
    const existingGroup = this.findGroup(groups, identifier);

    if (!existingGroup && identifier.groupId !== undefined) {
      throw new NotFoundException(`Group with id ${identifier.groupId} not found`);
    }

    let group: Group;
    let updatedGroups: Group[];

    if (existingGroup) {
      group = existingGroup.devices.includes(deviceId)
        ? existingGroup
        : { ...existingGroup, devices: [...existingGroup.devices, deviceId] };
      updatedGroups = groups.map((candidate) => (candidate.id === group.id ? group : candidate));
    } else {
      // No group matched this name above, so creating one here can never
      // collide with an existing name.
      group = { id: this.nextGroupId(groups), name: identifier.groupName as string, devices: [deviceId] };
      updatedGroups = [...groups, group];
    }

    await this.saveGroups(updatedGroups);
    return group;
  }

  async removeDeviceFromGroup(deviceId: number, identifier: GroupIdentifierDto): Promise<Group> {
    const groups = await this.getGroups();
    const group = this.findGroup(groups, identifier);

    if (!group) {
      throw new NotFoundException(this.identifierNotFoundMessage(identifier));
    }

    const updatedGroup: Group = {
      ...group,
      devices: group.devices.filter((id) => id !== deviceId),
    };

    const remainingGroups =
      updatedGroup.devices.length > 0
        ? groups.map((candidate) => (candidate.id === updatedGroup.id ? updatedGroup : candidate))
        : groups.filter((candidate) => candidate.id !== updatedGroup.id);

    await this.saveGroups(remainingGroups);
    return updatedGroup;
  }

  async listFilesForGroups(identifiers: readonly GroupIdentifierDto[]): Promise<string[]> {
    const groups = await this.getGroups();
    const resolvedGroups = identifiers.map((identifier) => {
      const group = this.findGroup(groups, identifier);
      if (!group) {
        throw new NotFoundException(this.identifierNotFoundMessage(identifier));
      }
      return group;
    });

    const deviceIds = [...new Set(resolvedGroups.flatMap((group) => group.devices))];
    const devices = await this.deviceService.findManyById(deviceIds);

    const files = new Set<string>();
    for (const device of devices) {
      for (const file of device.files) {
        files.add(file);
      }
    }

    return [...files];
  }

  private findGroup(groups: readonly Group[], identifier: GroupIdentifierDto): Group | undefined {
    if (identifier.groupId !== undefined) {
      return groups.find((group) => group.id === identifier.groupId);
    }
    return groups.find((group) => group.name === identifier.groupName);
  }

  private identifierNotFoundMessage(identifier: GroupIdentifierDto): string {
    return identifier.groupId !== undefined
      ? `Group with id ${identifier.groupId} not found`
      : `Group with name "${identifier.groupName}" not found`;
  }

  private nextGroupId(groups: readonly Group[]): number {
    return groups.reduce((max, group) => Math.max(max, group.id), 0) + 1;
  }

  private async getGroups(): Promise<Group[]> {
    return this.databaseService.getCollection<Group>(DatabaseCollection.Groups);
  }

  private async saveGroups(groups: readonly Group[]): Promise<void> {
    await this.databaseService.saveCollection<Group>(DatabaseCollection.Groups, groups);
  }
}
