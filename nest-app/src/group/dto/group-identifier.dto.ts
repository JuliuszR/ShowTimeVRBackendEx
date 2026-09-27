import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { ExactlyOneGroupIdentifier } from './exactly-one-group-identifier.validator';

/**
 * Only letters, numbers, spaces, underscores and hyphens. Keeps group names
 * from ever containing characters that would be meaningful to a downstream
 * parser (JSON path separators, control characters, etc).
 */
const GROUP_NAME_PATTERN = /^[\w\- ]+$/;

/**
 * A group referenced by either id or name, never both/neither. Shared by
 * every DTO that needs to point at a group.
 */
export class GroupIdentifierDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @ExactlyOneGroupIdentifier()
  groupId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(GROUP_NAME_PATTERN, {
    message: 'groupName may only contain letters, numbers, spaces, underscores and hyphens',
  })
  groupName?: string;
}
