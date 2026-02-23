import { IsString, IsNotEmpty } from 'class-validator';

export class RequestModificationDto {
    @IsString()
    @IsNotEmpty()
    modificationRequestReason: string;
}