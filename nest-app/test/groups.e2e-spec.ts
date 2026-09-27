import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DatabaseCollection } from '../src/database/database-collection.enum';
import { DatabaseService } from '../src/database/database.service';
import { Device } from '../src/device/models/device.model';
import { Group } from '../src/group/models/group.model';

const SEED_DEVICES: Device[] = [
  { id: 1, files: ['notavirus.exe', 'deathstarblueprint.pdf'] },
  { id: 2, files: ['deathstarblueprint.pdf', 'peterdinklagenudes.zip'] },
  { id: 3, files: ['peterdinklagenudes.zip', 'keyboardcat.mp4'] },
];

describe('Groups (e2e)', () => {
  let app: INestApplication<App>;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    databaseService = moduleFixture.get(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  // Every test starts from the same known state, independent of what
  // previous tests mutated, so ordering never matters.
  beforeEach(async () => {
    await databaseService.saveCollection<Device>(DatabaseCollection.Devices, SEED_DEVICES);
    await databaseService.saveCollection<Group>(DatabaseCollection.Groups, []);
  });

  const server = () => app.getHttpServer();

  describe('POST /groups/devices', () => {
    it('creates a new group when groupName does not exist yet', async () => {
      const response = await request(server())
        .post('/groups/devices')
        .send({ deviceId: 1, groupName: 'alpha' })
        .expect(200);

      expect(response.body).toEqual({ id: expect.any(Number), name: 'alpha', devices: [1] });
    });

    it('reuses the existing group instead of creating a duplicate by name', async () => {
      const first = await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });
      const second = await request(server())
        .post('/groups/devices')
        .send({ deviceId: 2, groupName: 'alpha' })
        .expect(200);

      expect(second.body.id).toBe(first.body.id);
      expect(second.body.devices).toEqual([1, 2]);
    });

    it('adds a device to an existing group by groupId', async () => {
      const created = await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });

      const response = await request(server())
        .post('/groups/devices')
        .send({ deviceId: 2, groupId: created.body.id })
        .expect(200);

      expect(response.body.devices).toEqual([1, 2]);
    });

    it('is idempotent when the device is already in the group', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });

      const response = await request(server())
        .post('/groups/devices')
        .send({ deviceId: 1, groupName: 'alpha' })
        .expect(200);

      expect(response.body.devices).toEqual([1]);
    });

    it('returns 404 for an unknown device id', async () => {
      const response = await request(server())
        .post('/groups/devices')
        .send({ deviceId: 999, groupName: 'alpha' })
        .expect(404);

      expect(response.body.message).toMatch(/999/);
    });

    it('returns 404 for an unknown groupId', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 1, groupId: 999 }).expect(404);
    });

    it('returns 400 when both groupId and groupName are provided', async () => {
      await request(server())
        .post('/groups/devices')
        .send({ deviceId: 1, groupId: 1, groupName: 'alpha' })
        .expect(400);
    });

    it('returns 400 when neither groupId nor groupName is provided', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 1 }).expect(400);
    });

    it('returns 400 for an unknown field (whitelist rejection)', async () => {
      await request(server())
        .post('/groups/devices')
        .send({ deviceId: 1, groupName: 'alpha', evil: 'x' })
        .expect(400);
    });

    it('returns 400 for a non-integer deviceId', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 'not-a-number', groupName: 'alpha' }).expect(400);
    });

    it.each([['../../etc/passwd'], ['name/with/slash'], ['name]with]bracket'], ['<script>alert(1)</script>']])(
      'returns 400 for a groupName containing disallowed characters (%s)',
      async (groupName) => {
        await request(server()).post('/groups/devices').send({ deviceId: 1, groupName }).expect(400);
      },
    );
  });

  describe('DELETE /groups/devices', () => {
    it('removes the device and keeps the group when others remain', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });
      await request(server()).post('/groups/devices').send({ deviceId: 2, groupName: 'alpha' });

      const response = await request(server())
        .delete('/groups/devices')
        .send({ deviceId: 1, groupName: 'alpha' })
        .expect(200);

      expect(response.body.devices).toEqual([2]);
    });

    it('deletes the group once its last device is removed', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });

      const response = await request(server())
        .delete('/groups/devices')
        .send({ deviceId: 1, groupName: 'alpha' })
        .expect(200);

      expect(response.body.devices).toEqual([]);

      // The group no longer exists, so any further reference to it 404s.
      await request(server()).post('/groups/files').send({ groups: [{ groupName: 'alpha' }] }).expect(404);
    });

    it('returns 404 for an unknown group', async () => {
      await request(server()).delete('/groups/devices').send({ deviceId: 1, groupName: 'nonexistent' }).expect(404);
    });
  });

  describe('POST /groups/files', () => {
    it('returns the deduplicated files for a single group', async () => {
      await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });
      await request(server()).post('/groups/devices').send({ deviceId: 2, groupName: 'alpha' });

      const response = await request(server())
        .post('/groups/files')
        .send({ groups: [{ groupName: 'alpha' }] })
        .expect(200);

      expect(response.body.sort()).toEqual(
        ['notavirus.exe', 'deathstarblueprint.pdf', 'peterdinklagenudes.zip'].sort(),
      );
    });

    it('deduplicates files across multiple groups mixing groupId and groupName', async () => {
      const alpha = await request(server()).post('/groups/devices').send({ deviceId: 1, groupName: 'alpha' });
      await request(server()).post('/groups/devices').send({ deviceId: 2, groupName: 'beta' });

      const response = await request(server())
        .post('/groups/files')
        .send({ groups: [{ groupId: alpha.body.id }, { groupName: 'beta' }] })
        .expect(200);

      expect(response.body.sort()).toEqual(
        ['notavirus.exe', 'deathstarblueprint.pdf', 'peterdinklagenudes.zip'].sort(),
      );
    });

    it('returns 404 when any referenced group does not exist', async () => {
      await request(server()).post('/groups/files').send({ groups: [{ groupName: 'nonexistent' }] }).expect(404);
    });

    it('returns 400 for an empty groups array', async () => {
      await request(server()).post('/groups/files').send({ groups: [] }).expect(400);
    });

    it('returns 400 when a group entry has both identifiers', async () => {
      await request(server())
        .post('/groups/files')
        .send({ groups: [{ groupId: 1, groupName: 'alpha' }] })
        .expect(400);
    });

    it('returns 400 for an unknown field on a nested group entry', async () => {
      await request(server())
        .post('/groups/files')
        .send({ groups: [{ groupId: 1, evil: 'x' }] })
        .expect(400);
    });
  });
});
