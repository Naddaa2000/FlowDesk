const {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
} = require("class-validator");

class CreateMemberDto {
  @IsNotEmpty()
  @IsString()
  name;

  @IsNotEmpty()
  @IsString()
  email;

  @IsNotEmpty()
  @IsString()
  role;

  @IsNotEmpty()
  @IsNumber()
  @Min(18)
  age;

  @IsNotEmpty()
  @IsString()
  password;

  @IsNotEmpty()
  @IsString()
  phoneNo;

  @IsOptional()
  @IsNumber()
  OTP;

  @IsOptional()
  @IsNumber()
  resetOTP;

  @IsOptional()
  @IsNumber()
  lastLogin;
}
module.exports = CreateMemberDto;
