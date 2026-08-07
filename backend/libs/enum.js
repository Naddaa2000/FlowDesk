module.exports = {
  // Only platform-level role. Everyone else is a regular user.
  GLOBAL_ROLE: Object.freeze({
    ADMIN: "admin",
    USER: "user",
  }),
  // Roles inside a project
  PROJECT_ROLE: Object.freeze({
    LEAD: "lead",
    DEVELOPER: "developer",
    QA: "qa",
  }),
  USER_STATUS: Object.freeze({
    ACTIVE: "active",
    INVITED: "invited",
    DISABLED: "disabled",
  }),
  MEMBER_STATUS: Object.freeze({
    ACTIVE: "active",
    INVITED: "invited",
  }),
  PRIORITY: Object.freeze({
    URGENT: "urgent",
    HIGH: "high",
    NORMAL: "normal",
    LOW: "low",
  }),
  STATUS_TYPE: Object.freeze({
    OPEN: "open",
    CUSTOM: "custom",
    CLOSED: "closed",
  }),
};
