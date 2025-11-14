// Mock repository for testing purposes
// This is a simplified mock for unit tests only

describe('Database Mock', () => {
  it('should be importable without errors', () => {
    expect(createMockRepository).toBeDefined();
  });
});

export const createMockRepository = <T>() => {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((data: any) => data),
    merge: jest.fn((entity: T, partial: any) => ({ ...entity, ...partial })),
  };
};
