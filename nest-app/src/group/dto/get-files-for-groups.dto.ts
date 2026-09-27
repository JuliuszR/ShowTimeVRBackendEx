import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { GroupIdentifierDto } from './group-identifier.dto';

export class GetFilesForGroupsDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupIdentifierDto)
  groups!: GroupIdentifierDto[];
}
