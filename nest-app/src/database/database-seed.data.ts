import { DatabaseCollection } from './database-collection.enum';

/**
 * Initial contents used to populate the database file the first time it is
 * created (or when a collection is missing from an existing file).
 * Matches the fixture data from the task specification.
 */
export const DATABASE_SEED: Readonly<Record<DatabaseCollection, readonly unknown[]>> = {
  [DatabaseCollection.Devices]: [
    { id: 1, files: ['notavirus.exe', 'deathstarblueprint.pdf'] },
    { id: 2, files: ['deathstarblueprint.pdf', 'peterdinklagenudes.zip'] },
    { id: 3, files: ['peterdinklagenudes.zip', 'keyboardcat.mp4'] },
  ],
  [DatabaseCollection.Groups]: [],
};
