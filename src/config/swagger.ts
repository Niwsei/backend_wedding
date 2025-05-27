// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import config from './index'; // Import config ของคุณ (อาจจะมี version, title)
import logger from '../utils/logger'; // Import logger ของคุณ

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blissful Weddings API',
      version: '1.0.0', // หรืออ่านจาก package.json
      description: 'API documentation for the Blissful Weddings application.',
      contact: {
        name: 'API Support',
        // url: 'http://www.example.com/support',
        email: 'rambo@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`, // URL ของ Development Server
        description: 'Development server',
      },
      // เพิ่ม Production server URL ที่นี่เมื่อ Deploy แล้ว
      // {
      //   url: 'https://api.yourdomain.com/api',
      //   description: 'Production server',
      // }
    ],
    components: { // (Optional) กำหนด Security Schemes, Reusable Schemas
      securitySchemes: {
        bearerAuth: { // ตั้งชื่อ Scheme
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // คุณจะต้องคัดลอกโครงสร้าง Schema จาก JSDoc ในไฟล์ .schema.ts มาใส่ที่นี่
        // หรือใช้ library เช่น zod-to-openapi เพื่อ generate ส่วนนี้จาก Zod schemas โดยตรง
        // ตัวอย่าง (ต้องพิมพ์เองให้ตรงกับ JSDoc):
        UserInputBase: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', description: "User's email address.", example: 'user@example.com' },
      fullName: { type: 'string', description: "User's full name.", example: 'John Doe' },
      username: { type: 'string', description: "User's unique username.", example: 'johndoe123' },
    },
  },
         SignupBody: { // เปลี่ยนชื่อให้ชัดเจนว่าเป็น Body ของ Signup
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      password: { type: 'string', format: 'password', minLength: 6, example: 'password123' },
      fullName: { type: 'string', minLength: 2, example: 'Test User' }, // optionality ถูกควบคุมโดย Zod
      username: { type: 'string', minLength: 4, example: 'testuser' }, // optionality ถูกควบคุมโดย Zod
    },
  },

   LoginBody: { // เปลี่ยนชื่อให้ชัดเจนว่าเป็น Body ของ Login
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      password: { type: 'string', format: 'password', example: 'password123' },
    },
  },
        LoginInput: { 
            type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', format: 'password' },
  }
        },
        UserResponse: { // Schema สำหรับ User data ที่ตอบกลับ
    allOf: [ // ใช้ allOf ถ้าต้องการ kế thừa UserInputBase
      { $ref: '#/components/schemas/UserInputBase' },
      {
        type: 'object',
        properties: {
          user_id: { type: 'integer', example: 1 },
          user_role: { type: 'string', enum: ['client', 'admin'], example: 'client' }, // ใช้ enum
          phone_number: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$', nullable: true, example: '+1234567890' },
          avatar_url: { type: 'string', format: 'url', nullable: true, example: 'http://example.com/avatar.jpg' },
          wedding_date: { type: 'string', format: 'date-time', nullable: true },
          planning_status: { type: 'string', nullable: true },
          total_budget: { type: 'number', format: 'double', nullable: true }, // หรือ type: 'string' ถ้า DECIMAL มาเป็น string
          phone_verified_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
    ],
  },
        AuthResponse: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'JWT authentication token.' },
      user: { $ref: '#/components/schemas/UserResponse' },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'fail' }, // or 'error'
      message: { type: 'string', example: 'Validation failed' },
      statusCode: { type: 'integer', example: 400 },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'body.email' },
            message: { type: 'string', example: 'Invalid email address' },
          },
        },
        nullable: true, // errors อาจจะไม่มีก็ได้
      },
    },
  },
        RequestOtpBody: {
      type: 'object',
      required: ['phoneNumber'],
      properties: {
          phoneNumber: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$', description: 'Phone number in E.164 format', example: '+12345678900'}
      }
  },
  VerifyOtpBody: {
      type: 'object',
      required: ['phoneNumber', 'otp', 'password'],
      properties: {
          phoneNumber: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$', example: '+12345678900' },
          otp: { type: 'string', minLength: 6, maxLength: 6, example: '123456' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'newPassword123' },
          fullName: { type: 'string', example: 'OTP User', nullable: true },
          username: { type: 'string', example: 'otpuser123', nullable: true },
      }
  },
  SuccessMessageResponse: { // Schema สำหรับ response ที่มี message เฉยๆ
      type: 'object',
      properties: {
          status: { type: 'string', example: 'success'},
          message: { type: 'string' }
      }
  },

  // --- Task Schemas ---
  Task: {
    type: 'object',
    properties: {
      task_id: { type: 'integer' },
      user_id: { type: 'integer' },
      title: { type: 'string' },
      dueDescription : { type: 'string', nullable: true },
      due_date: { type: 'string', format: 'date-time', nullable: true },
      is_completed: { type: 'boolean' },
      notes: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    }
  },
  CreateTaskBody: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1 },
      dueDescription: { type: 'string', nullable: true },
      dueDate: { type: 'string', format: 'date-time', nullable: true },
      notes: { type: 'string', nullable: true },
    }
  },
  UpdateTaskBody: {
    type: 'object',
    properties: { // ทุก field optional
      title: { type: 'string', minLength: 1 },
      dueDescription: { type: 'string', nullable: true },
      dueDate: { type: 'string', format: 'date-time', nullable: true },
      notes: { type: 'string', nullable: true },
      isCompleted: { type: 'boolean' },
    }
  },
  TaskIdParam: { // สำหรับ Path Parameter
      name: 'taskId',
      in: 'path',
      required: true,
      description: 'ID of the task',
      schema: { type: 'integer', minimum: 1 }
  },


  // --- Budget Schemas ---
  BudgetCategoryData: {
    type: 'object',
    properties: {
      category_id: { type: 'integer'},
      name: { type: 'string', example: 'Venue & Catering'},
      spent_amount: { type: 'number', format: 'double', example: 15000.00 }
    }
  },
  BudgetOverviewResponse: {
    type: 'object',
    properties: {
      total_budget: { type: 'number', format: 'double', nullable: true, example: 35000.00 },
      total_spent: { type: 'number', format: 'double', example: 22450.00 },
      categories: {
        type: 'array',
        items: { $ref: '#/components/schemas/BudgetCategoryData' }
      }
    }
  },
  UpdateBudgetCategorySpentBody: {
    type: 'object',
    required: ['spentAmount'],
    properties: {
      spentAmount: { type: 'number', minimum: 0 }
    }
  },
  CategoryIdParam: {
      name: 'categoryId',
      in: 'path',
      required: true,
      description: 'ID of the budget category',
      schema: { type: 'integer', minimum: 1 }
  },

  // --- Inspiration Schemas ---
  SavedInspirationItem: { // Schema สำหรับ Item ใน List ของ Saved Inspirations
      type: 'object',
      properties: {
          item_id: { type: 'integer'},
          image_url: { type: 'string', format: 'url'},
          title: { type: 'string', nullable: true }
      }
  },
  GalleryItemIdParam: { // Parameter สำหรับ itemId
      name: 'itemId',
      in: 'path',
      required: true,
      description: 'ID of the Gallery Item',
      schema: { type: 'integer', minimum: 1 }
  },

  // --- Service Schemas ---
  ServiceFeature: {
      type: 'object',
      properties: {
          // feature_id: { type: 'integer'}, // ถ้าต้องการ
          feature_name: { type: 'string'}
      }
  },
  ServiceResponse: {
      type: 'object',
      properties: {
          service_id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          base_price: { type: 'number', format: 'double', nullable: true },
          cover_image_url: { type: 'string', format: 'url', nullable: true },
          icon_url: { type: 'string', format: 'url', nullable: true },
          is_active: { type: 'boolean' },
          // created_at, updated_at
          features: { // ถ้า Service มี features
              type: 'array',
              items: { type: 'string' }, // หรือ $ref: '#/components/schemas/ServiceFeature' ถ้าซับซ้อน
              nullable: true
          }
      },
  },
  CreateServiceBody: { /* ... กำหนดตาม Zod Schema ... */ },
  UpdateServiceBody: { /* ... กำหนดตาม Zod Schema ... */ },
  ServiceIdParam: { name: 'serviceId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } },

  // --- Package Schemas ---
  PackageServiceItem: { // Service ย่อๆ ที่อยู่ใน Package
      type: 'object',
      properties: {
          service_id: { type: 'integer'},
          name: { type: 'string' },
          category: { type: 'string', nullable: true },
          base_price: { type: 'number', format: 'double', nullable: true }
      }
  },
  PackageResponse: {
      type: 'object',
      properties: {
          package_id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          price: { type: 'number', format: 'double' },
          cover_image_url: { type: 'string', format: 'url', nullable: true },
          is_popular: { type: 'boolean' },
          is_active: { type: 'boolean' },
          // created_at, updated_at
          services: { // รายการ services ใน package
              type: 'array',
              items: { $ref: '#/components/schemas/PackageServiceItem' },
              nullable: true
          }
      }
  },
        // เพิ่ม OTP Schemas, Service Schemas, Package Schemas etc. ที่นี่
      }
    },
    // security: [ // (Optional) กำหนด Default security scheme
    //   {
    //     bearerAuth: [],
    //   },
    // ],
  },
  // Path ไปยังไฟล์ที่มี JSDoc comments สำหรับ API routes
  // ควรจะชี้ไปที่ไฟล์ Routes หรือ Controllers ของคุณ
  apis: ['./src/routes/*.ts', './src/schemas/*.ts'], // ตัวอย่าง: ให้ JSDoc อ่านจากไฟล์ routes และ schemas
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      // customCss: '.swagger-ui .topbar { display: none }' // (Optional) ซ่อน Topbar
  }));
  logger.info(`API Docs available at http://localhost:${config.PORT}/api-docs`);
};
