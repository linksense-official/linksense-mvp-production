// Prisma Client Mock for Jest
// Prisma Client の機能をテスト用にモックします

const mockPrismaClient = {
  // User model mock
  user: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  
  // Account model mock
  account: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  
  // Session model mock
  session: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  
  // VerificationToken model mock
  verificationToken: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  
  // LoginHistory model mock
  loginHistory: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  
  // Transaction support
  $transaction: jest.fn().mockImplementation((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrismaClient)
    }
    return Promise.resolve(callback)
  }),
  
  // Connection management
  $connect: jest.fn().mockResolvedValue(),
  $disconnect: jest.fn().mockResolvedValue(),
  
  // Raw queries
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  
  // Extensions
  $extends: jest.fn().mockReturnThis(),
  
  // Metrics
  $metrics: {
    histogram: jest.fn(),
    counter: jest.fn(),
  },
  
  // Events
  $on: jest.fn(),
  $emit: jest.fn(),
  
  // Utils
  $use: jest.fn(),
}

// PrismaClient constructor mock
const PrismaClient = jest.fn().mockImplementation(() => mockPrismaClient)

// Export both named and default exports
module.exports = {
  PrismaClient,
  Prisma: {
    TransactionIsolationLevel: {
      ReadUncommitted: 'ReadUncommitted',
      ReadCommitted: 'ReadCommitted',
      RepeatableRead: 'RepeatableRead',
      Serializable: 'Serializable',
    },
    UserScalarFieldEnum: {
      id: 'id',
      email: 'email',
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
}

module.exports.default = PrismaClient