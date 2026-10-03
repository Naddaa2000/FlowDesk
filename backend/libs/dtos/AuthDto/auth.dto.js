const {
  IsNotEmpty,
  IsString,
} = require("class-validator");

class AuthMemberDto {

  @IsNotEmpty()
  @IsString()
  email;

  @IsNotEmpty()
  @IsString()
  password;

}
module.exports = AuthMemberDto;
