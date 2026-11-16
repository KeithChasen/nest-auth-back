import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Incorrect email format' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password shouldnt be less than 6 characters' })
  @IsNotEmpty()
  password: string;
}
