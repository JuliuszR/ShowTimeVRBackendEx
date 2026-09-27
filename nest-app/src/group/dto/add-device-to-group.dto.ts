import { IsInt, Min } from 'class-validator';
import { GroupIdentifierDto } from './group-identifier.dto';

export class AddDeviceToGroupDto extends GroupIdentifierDto {
  @IsInt()
  @Min(1)
  deviceId!: number;
}
