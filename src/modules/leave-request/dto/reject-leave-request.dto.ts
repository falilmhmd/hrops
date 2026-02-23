import { IsString, IsNotEmpty } from 'class-validator';

export class RejectLeaveRequestDto {
    @IsString()
    @IsNotEmpty()
    rejectionReason: string;
}