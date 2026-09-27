/**
 * Fixed set of top-level JsonDB paths. Using an enum instead of raw strings
 * means callers can never build a collection path from user input, which is
 * what would otherwise open the door to JsonDB path-injection.
 */
export enum DatabaseCollection {
  Devices = '/devices',
  Groups = '/groups',
}
