const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ClickUp CRUD API",
      version: "1.0.0",
      description: "API documentation for members and authentication",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: "Local server",
      },
    ],
    tags: [
      { name: "Members", description: "Member management endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
    ],
    components: {
      schemas: {
        Member: {
          type: "object",
          properties: {
            _id: { type: "string", example: "66b9f1a2c3d4e5f678901234" },
            name: { type: "string", example: "John Doe" },
            age: { type: "integer", example: 25 },
            email: { type: "string", format: "email", example: "john@example.com" },
            role: {
              type: "string",
              enum: ["admin", "user", "guest", "projectLead", "developer", "qa"],
              example: "developer",
            },
            phoneNo: { type: "string", example: "03001234567" },
            status: {
              type: "string",
              enum: ["active", "blocked", "pending", "rejected", "disabled"],
              example: "active",
            },
            OTP: { type: "string", nullable: true },
            resetOTP: { type: "string", nullable: true },
            lastLogin: { type: "string", format: "date-time", nullable: true },
            password: { type: "string", description: "Hashed password" },
          },
        },
        CreateMemberRequest: {
          type: "object",
          required: ["name", "email", "role", "age", "password", "phoneNo"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            role: {
              type: "string",
              enum: ["admin", "user", "guest", "projectLead", "developer", "qa"],
              example: "developer",
            },
            age: { type: "integer", minimum: 18, example: 25 },
            password: { type: "string", format: "password", example: "Secret123!" },
            phoneNo: { type: "string", example: "03001234567" },
            OTP: { type: "number", nullable: true },
            resetOTP: { type: "number", nullable: true },
            lastLogin: { type: "number", nullable: true },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", format: "password", example: "Secret123!" },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            error: { type: "object", nullable: true, example: null },
            message: { type: "string", example: "Operation successful" },
            result: {},
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "fail" },
            error: {},
            message: { type: "string", example: "Something went wrong" },
            result: { type: "object", nullable: true, example: null },
          },
        },
      },
    },
    paths: {
      "/members": {
        get: {
          tags: ["Members"],
          summary: "Get all members",
          responses: {
            200: {
              description: "Members fetched successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          result: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Member" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            500: {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Members"],
          summary: "Create a member",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateMemberRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Member created successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          result: { $ref: "#/components/schemas/Member" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "Member already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/members/{id}": {
        get: {
          tags: ["Members"],
          summary: "Get a member by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Member MongoDB ObjectId",
            },
          ],
          responses: {
            200: {
              description: "Member found",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          result: { $ref: "#/components/schemas/Member" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: "Member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Members"],
          summary: "Delete a member by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Member MongoDB ObjectId",
            },
          ],
          responses: {
            200: {
              description: "Member deleted successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            404: {
              description: "Member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        type: "object",
                        properties: {
                          result: {
                            type: "object",
                            properties: {
                              token: { type: "string" },
                              expiresIn: { type: "string", example: "1d" },
                              user: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  email: { type: "string" },
                                  phone: { type: "string" },
                                  role: { type: "string" },
                                  dob: { type: "string" },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Validation or account status error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
