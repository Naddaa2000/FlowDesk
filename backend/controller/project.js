const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const successResponse = require("../libs/responseMessage/success");
const errorResponse = require("../libs/responseMessage/error");
const { sendEmail } = require("../libs/utils/email");
const {
  GLOBAL_ROLE,
  PROJECT_ROLE,
  MEMBER_STATUS,
  USER_STATUS,
} = require("../libs/enum");
const { publicUser } = require("./auth");

function serializeProject(project, members = []) {
  return {
    id: project._id,
    name: project.name,
    description: project.description,
    color: project.color,
    leadId: project.lead?._id || project.lead,
    lead: project.lead?.name
      ? publicUser(project.lead)
      : undefined,
    createdBy: project.createdBy?._id || project.createdBy,
    statuses: project.statuses.map((s) => ({
      id: String(s._id),
      name: s.name,
      color: s.color,
      orderindex: s.orderindex,
      type: s.type,
    })),
    memberIds: members.map((m) => String(m.user?._id || m.user)),
    members: members.map((m) => ({
      id: m._id,
      role: m.role,
      status: m.status,
      user: m.user?.email ? publicUser(m.user) : { id: m.user },
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

/** Admin or any lead-capable user (admin/member) can create; creator becomes lead unless admin assigns another */
const createProject = async (req, res) => {
  try {
    const { name, description, color, leadId } = req.body;
    if (!name?.trim()) return errorResponse(res, "Project name is required", 400);

    let leadUserId = req.user._id;

    // Admin may assign a lead; otherwise creator is lead
    if (leadId) {
      if (req.user.role !== GLOBAL_ROLE.ADMIN && String(leadId) !== String(req.user._id)) {
        return errorResponse(res, "Only admin can assign another user as lead", 403);
      }
      const leadUser = await User.findById(leadId);
      if (!leadUser) return errorResponse(res, "Lead user not found", 404);
      leadUserId = leadUser._id;
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || "",
      color: color || "#0f766e",
      lead: leadUserId,
      createdBy: req.user._id,
    });

    // Add lead as project member
    await ProjectMember.create({
      project: project._id,
      user: leadUserId,
      role: PROJECT_ROLE.LEAD,
      status: MEMBER_STATUS.ACTIVE,
      invitedBy: req.user._id,
    });

    // If admin created and assigned someone else, also add admin as member (lead role for visibility)
    if (
      req.user.role === GLOBAL_ROLE.ADMIN &&
      String(leadUserId) !== String(req.user._id)
    ) {
      await ProjectMember.create({
        project: project._id,
        user: req.user._id,
        role: PROJECT_ROLE.DEVELOPER,
        status: MEMBER_STATUS.ACTIVE,
        invitedBy: req.user._id,
      });
    }

    const members = await ProjectMember.find({ project: project._id }).populate("user");
    const populated = await Project.findById(project._id).populate("lead");

    return successResponse(
      res,
      "Project created",
      serializeProject(populated, members),
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/** List only projects the user is a member of (admin sees all) */
const listProjects = async (req, res) => {
  try {
    let projects;
    let memberships;

    if (req.user.role === GLOBAL_ROLE.ADMIN) {
      projects = await Project.find().populate("lead").sort({ updatedAt: -1 });
      memberships = await ProjectMember.find({
        project: { $in: projects.map((p) => p._id) },
        status: MEMBER_STATUS.ACTIVE,
      }).populate("user");
    } else {
      memberships = await ProjectMember.find({
        user: req.user._id,
        status: MEMBER_STATUS.ACTIVE,
      }).populate("user");
      const ids = memberships.map((m) => m.project);
      projects = await Project.find({ _id: { $in: ids } })
        .populate("lead")
        .sort({ updatedAt: -1 });
      memberships = await ProjectMember.find({
        project: { $in: ids },
        status: MEMBER_STATUS.ACTIVE,
      }).populate("user");
    }

    const byProject = memberships.reduce((acc, m) => {
      const key = String(m.project);
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

    const data = projects.map((p) => serializeProject(p, byProject[String(p._id)] || []));
    return successResponse(res, "Projects", data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate("lead");
    const members = await ProjectMember.find({
      project: project._id,
      status: { $in: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.INVITED] },
    }).populate("user");
    return successResponse(res, "Project", serializeProject(project, members));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description, color, leadId } = req.body;
    const project = req.project;

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;

    // Only admin or current lead can reassign lead
    if (leadId && String(leadId) !== String(project.lead)) {
      if (!req.isProjectLead && req.user.role !== GLOBAL_ROLE.ADMIN) {
        return errorResponse(res, "Only lead or admin can change project lead", 403);
      }
      const newLead = await User.findById(leadId);
      if (!newLead) return errorResponse(res, "Lead user not found", 404);

      // Ensure new lead is a member
      let membership = await ProjectMember.findOne({
        project: project._id,
        user: leadId,
      });
      if (!membership) {
        membership = await ProjectMember.create({
          project: project._id,
          user: leadId,
          role: PROJECT_ROLE.LEAD,
          status: MEMBER_STATUS.ACTIVE,
          invitedBy: req.user._id,
        });
      } else {
        membership.role = PROJECT_ROLE.LEAD;
        membership.status = MEMBER_STATUS.ACTIVE;
        await membership.save();
      }

      // Demote previous lead to developer
      await ProjectMember.updateOne(
        { project: project._id, user: project.lead },
        { role: PROJECT_ROLE.DEVELOPER }
      );

      project.lead = leadId;
    }

    await project.save();
    const populated = await Project.findById(project._id).populate("lead");
    const members = await ProjectMember.find({ project: project._id }).populate("user");
    return successResponse(res, "Project updated", serializeProject(populated, members));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteProject = async (req, res) => {
  try {
    if (!req.isProjectLead && req.user.role !== GLOBAL_ROLE.ADMIN) {
      return errorResponse(res, "Only lead or admin can delete project", 403);
    }
    await ProjectMember.deleteMany({ project: req.project._id });
    await Project.findByIdAndDelete(req.project._id);
    return successResponse(res, "Project deleted", null);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const listMembers = async (req, res) => {
  try {
    const members = await ProjectMember.find({ project: req.params.projectId }).populate(
      "user"
    );
    return successResponse(
      res,
      "Members",
      members.map((m) => ({
        id: m._id,
        role: m.role,
        status: m.status,
        user: publicUser(m.user),
      }))
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Lead or admin: add existing user OR invite new email.
 * Body: { userId? } OR { email, name?, role? }
 */
const addOrInviteMember = async (req, res) => {
  try {
    const { userId, email, name, role } = req.body;
    const project = req.project;

    const allowedRoles = Object.values(PROJECT_ROLE);
    const memberRole = allowedRoles.includes(role) ? role : PROJECT_ROLE.DEVELOPER;

    let user;

    if (userId) {
      user = await User.findById(userId);
      if (!user) return errorResponse(res, "User not found", 404);
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if(user){
        return errorResponse(res, "User already exists in the database please add them to the project", 409);
      }
      if (!user) {
        const tempPass = crypto.randomBytes(9).toString("hex");
        const hashed = await bcrypt.hash(tempPass, 10);
        user = await User.create({
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          password: hashed,
          role: GLOBAL_ROLE.USER,
          status: USER_STATUS.INVITED,
          avatarColor: `#${Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, "0")}`,
        });

        await sendEmail({
          to: user.email,
          subject: `You're invited to ${project.name} on FlowDesk`,
          text: `Hi ${user.name},\n\nYou were invited to project "${project.name}" as ${memberRole}.\nLogin email: ${user.email}\nTemporary password: ${tempPass}\n\nOpen: ${process.env.CLIENT_URL}\n`,
          html: `<p>Hi ${user.name},</p><p>You were invited to project <b>${project.name}</b> as <b>${memberRole}</b>.</p><p>Email: ${user.email}<br/>Temp password: <code>${tempPass}</code></p><p><a href="${process.env.CLIENT_URL}">Open FlowDesk</a></p>`,
        });
      }
    } else {
      return errorResponse(res, "Provide userId or email", 400);
    }

    let membership = await ProjectMember.findOne({
      project: project._id,
      user: user._id,
    });

    if (membership && membership.status === MEMBER_STATUS.ACTIVE) {
      return errorResponse(res, "User is already a project member", 409);
    }

    const inviteToken = crypto.randomBytes(24).toString("hex");

    if (membership) {
      membership.status = MEMBER_STATUS.ACTIVE;
      membership.role = memberRole;
      membership.invitedBy = req.user._id;
      membership.inviteToken = inviteToken;
      await membership.save();
    } else {
      membership = await ProjectMember.create({
        project: project._id,
        user: user._id,
        role: memberRole,
        status: MEMBER_STATUS.ACTIVE,
        invitedBy: req.user._id,
        inviteToken,
      });
    }

    // If promoting to lead, update project.lead and demote previous
    if (memberRole === PROJECT_ROLE.LEAD) {
      await ProjectMember.updateMany(
        { project: project._id, user: { $ne: user._id }, role: PROJECT_ROLE.LEAD },
        { role: PROJECT_ROLE.DEVELOPER }
      );
      project.lead = user._id;
      await project.save();
    }

    if (user.status !== USER_STATUS.INVITED) {
      await sendEmail({
        to: user.email,
        subject: `Added to ${project.name} on FlowDesk`,
        text: `You were added to project "${project.name}" as ${memberRole}.`,
      });
    }

    await membership.populate("user");
    return successResponse(
      res,
      "Member added",
      {
        id: membership._id,
        role: membership.role,
        status: membership.status,
        user: publicUser(membership.user),
      },
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.project.lead) === String(userId)) {
      return errorResponse(res, "Cannot remove the project lead. Reassign lead first.", 400);
    }

    const membership = await ProjectMember.findOneAndDelete({
      project: req.params.projectId,
      user: userId,
    });
    if (!membership) return errorResponse(res, "Member not found", 404);

    const user = await User.findById(userId);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Removed from ${req.project.name}`,
        text: `You were removed from project "${req.project.name}".`,
      });
    }

    return successResponse(res, "Member removed", null);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const addStatus = async (req, res) => {
  try {
    const { name, color, type } = req.body;
    if (!name?.trim()) return errorResponse(res, "Status name required", 400);

    const project = req.project;
    project.statuses.push({
      name: name.trim(),
      color: color || "#64748b",
      orderindex: project.statuses.length,
      type: type || "custom",
    });
    await project.save();
    const created = project.statuses[project.statuses.length - 1];
    return successResponse(
      res,
      "Status created",
      {
        id: String(created._id),
        name: created.name,
        color: created.color,
        orderindex: created.orderindex,
        type: created.type,
      },
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/** Lead/admin only — rename / recolor a status group */
const updateStatus = async (req, res) => {
  try {
    const { name, color, type, orderindex } = req.body;
    const status =
      req.project.statuses.id(req.params.statusId) ||
      req.project.statuses.find((s) => String(s._id) === String(req.params.statusId));

    if (!status) return errorResponse(res, "Status group not found", 404);

    if (name !== undefined) {
      if (!String(name).trim()) return errorResponse(res, "Status name required", 400);
      status.name = String(name).trim();
    }
    if (color !== undefined) status.color = color;
    if (type !== undefined) status.type = type;
    if (orderindex !== undefined) status.orderindex = orderindex;

    await req.project.save();
    return successResponse(res, "Status updated", {
      id: String(status._id),
      name: status.name,
      color: status.color,
      orderindex: status.orderindex,
      type: status.type,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/** Lead/admin only — reorder status groups. Body: { orderedIds: string[] } */
const reorderStatuses = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return errorResponse(res, "orderedIds array required", 400);
    }

    const project = req.project;
    const byId = new Map(
      project.statuses.map((s) => [String(s._id), s]),
    );

    if (orderedIds.length !== project.statuses.length) {
      return errorResponse(res, "orderedIds must include every status", 400);
    }

    for (const id of orderedIds) {
      if (!byId.has(String(id))) {
        return errorResponse(res, `Unknown status id: ${id}`, 400);
      }
    }

    orderedIds.forEach((id, i) => {
      byId.get(String(id)).orderindex = i;
    });

    project.statuses.sort((a, b) => a.orderindex - b.orderindex);
    await project.save();

    return successResponse(
      res,
      "Statuses reordered",
      project.statuses.map((s) => ({
        id: String(s._id),
        name: s.name,
        color: s.color,
        orderindex: s.orderindex,
        type: s.type,
      })),
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/** Lead/admin only — delete a status group (move tasks to another status if needed) */
const deleteStatus = async (req, res) => {
  try {
    const project = req.project;
    const statusId = String(req.params.statusId);
    const status =
      project.statuses.id(statusId) ||
      project.statuses.find((s) => String(s._id) === statusId);

    if (!status) return errorResponse(res, "Status group not found", 404);
    if (project.statuses.length <= 1) {
      return errorResponse(res, "Cannot delete the last status group", 400);
    }

    const fallback =
      project.statuses.find((s) => String(s._id) !== statusId) || project.statuses[0];

    const Task = require("../models/Task");
    await Task.updateMany(
      { project: project._id, statusId: status._id },
      { statusId: fallback._id }
    );

    project.statuses = project.statuses.filter((s) => String(s._id) !== statusId);
    project.statuses.forEach((s, i) => {
      s.orderindex = i;
    });
    await project.save();

    return successResponse(res, "Status group deleted", {
      movedToStatusId: String(fallback._id),
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addOrInviteMember,
  removeMember,
  addStatus,
  updateStatus,
  reorderStatuses,
  deleteStatus,
  serializeProject,
};
