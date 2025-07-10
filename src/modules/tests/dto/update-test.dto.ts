import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTestDto } from './create-test.dto';

export class UpdateTestDto extends PartialType(
  OmitType(CreateTestDto, ['questions'] as const),
) {}