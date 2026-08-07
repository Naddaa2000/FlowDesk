const Memberdata = require("../models/Memberdata");
const mongoose = require("mongoose");

const successMessage = require("../libs/responseMessage/success");
const errorMessage = require("../libs/responseMessage/error");
const { validate } = require("class-validator");
const { plainToClass } = require("class-transformer");
const CreateMemberDto = require("../libs/dtos/MemberDto/createMember.dto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { STATUS } = require("../libs/enum");
const createMember = async (req, res) => {
  try {
    const createMemberDto = plainToClass(CreateMemberDto, req.body);
    const errors = await validate(createMemberDto);

    if (errors.length > 0) {
      return errorMessage(res, errors, 400);
    }
    const { id, name, age, email, role, phoneNo,password } = req.body;
   const existingMember = await Memberdata.findOne({
  $or: [
    { email },
    { phoneNo }
  ]
});

if (existingMember) {
  if (existingMember.email === email) {
    return errorMessage(res, "Member email already exists", 409);
  }
if (existingMember.name === name) {
    return errorMessage(res, "Member name already exists", 409);
  }
  if (existingMember.phoneNo === phoneNo) {
    return errorMessage(res, "Member phone number already exists", 409);
  }
}
 const salt = await bcrypt.genSalt(10);
 const hashedPassword = await bcrypt.hash(password, salt)
 const createMember = await Memberdata.create({
        name,
        age,
        email,
        role,
        phoneNo,
        password: hashedPassword,
        status: STATUS.ACTIVE
    });
    console.log(createMember);
    // await Memberdata.save(createMember);
    return successMessage(res, "member created successfully", createMember);
  } catch (error) {
    return errorMessage(res, error.message);
  }
};
const getMember = async (req, res) => {
  try {
    const members = await Memberdata.find();
   return successMessage(res, "members fetched successfully", members);
  } catch (error) {
    return errorMessage(res, error.message);
  }
};
const deleteMember = async (req, res) => {
  try {
    const { _id } = req.params;
    console.log("id", _id);
    const members = await Memberdata.findOne({ _id: _id });
    console.log(members);

    if (!members) {
      return errorMessage(res, "member not found", 404);
    }
    await Memberdata.findByIdAndDelete(_id);
    return successMessage(res, `member deleted successfully`, 200);
  } catch (error) {
    return errorMessage(res, error.message);
  }
};
const getSingleMember = async (req, res) => {
  try {
    const { _id } = req.params;
    console.log("id is", _id);

    const member = await Memberdata.findOne({ _id: _id });
    console.log("member is", member);

    if (!member) {
      return errorMessage(res, "member not found", 404);
    }

    return successMessage(res, `member found`, member);
  } catch (error) {
    return errorMessage(res, error.message);
  }
};
const inviteMMember = async (req, res) => {
  try {
    const { name, email, sentBy, projectName } = req.body;
    const existingMember = await Memberdata.findOne({
  $or: [
    { email },
    { name }
  ]
});
if (existingMember) {
  if (existingMember.email === email) {
    return errorMessage(res, "Member email already exists", 409);
  }
if (existingMember.name === name) {
    return errorMessage(res, "Member name already exists", 409);
  }
}else{
  // Send invitation email
  const signupLink = `${process.env.CLIENT_URL}/signup?ref=${existingMember._id}`;
  const emailContent = inviteUser(signupLink, name, sentBy, projectName);
  await sendEmail(email, "You're Invited to Join Ccript Clickup team", emailContent);
  return successMessage(res, "Invitation sent successfully", { email });
}

  } catch (error) {
    
  }
}

module.exports = { createMember, getMember, deleteMember, getSingleMember };
