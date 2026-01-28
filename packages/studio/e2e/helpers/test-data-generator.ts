/**
 * Test Data Generator
 *
 * Provides utilities for generating realistic test data
 * including user data, form inputs, and mock responses
 */

import { faker } from '@faker-js/faker';

// Set a consistent seed for reproducible tests
faker.seed(12345);

export type UserRole = 'admin' | 'user' | 'guest' | 'moderator';

export interface UserTestData {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  password: string;
  role: UserRole;
  bio?: string;
  avatar?: string;
  createdAt: Date;
}

export interface FormDataTestData {
  [key: string]: string | number | boolean | string[];
}

/**
 * Generate a test user with realistic data
 */
export function generateTestUser(overrides: Partial<UserTestData> = {}): UserTestData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();

  return {
    id: faker.string.uuid(),
    email,
    username: faker.internet.userName({ firstName, lastName }),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    password: 'TestPassword123!', // Consistent password for tests
    role: 'user',
    bio: faker.lorem.paragraph(),
    avatar: faker.image.avatar(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

/**
 * Generate an array of test users
 */
export function generateTestUsers(count: number, overrides: Partial<UserTestData> = {}): UserTestData[] {
  return Array.from({ length: count }, () => generateTestUser(overrides));
}

/**
 * Generate test form data
 */
export function generateFormData(schema: Record<string, 'email' | 'name' | 'password' | 'text' | 'number' | 'url' | 'phone'>): FormDataTestData {
  const data: FormDataTestData = {};

  for (const [field, type] of Object.entries(schema)) {
    switch (type) {
      case 'email':
        data[field] = faker.internet.email();
        break;
      case 'name':
        data[field] = faker.person.fullName();
        break;
      case 'password':
        data[field] = 'TestPassword123!';
        break;
      case 'text':
        data[field] = faker.lorem.sentence();
        break;
      case 'number':
        data[field] = faker.number.int({ min: 1, max: 100 });
        break;
      case 'url':
        data[field] = faker.internet.url();
        break;
      case 'phone':
        data[field] = faker.phone.number();
        break;
    }
  }

  return data;
}

/**
 * Generate random text of specified length
 */
export function generateText(wordCount: number): string {
  return faker.lorem.words(wordCount);
}

/**
 * Generate a random number within range
 */
export function generateNumber(min: number, max: number): number {
  return faker.number.int({ min, max });
}

/**
 * Generate a random date
 */
export function generateDate(from?: Date, to?: Date): Date {
  return faker.date.between({ from: from || new Date(2020, 0, 1), to: to || new Date() });
}

/**
 * Generate a random boolean
 */
export function generateBoolean(): boolean {
  return faker.datatype.boolean();
}

/**
 * Generate a random UUID
 */
export function generateUUID(): string {
  return faker.string.uuid();
}

/**
 * Generate a random color (hex)
 */
export function generateColor(): string {
  return faker.color.rgb();
}

/**
 * Generate test data for specific components
 */
export const componentTestData = {
  card: () => ({
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
  }),

  button: () => ({
    label: faker.lorem.words(3),
    disabled: faker.datatype.boolean(),
  }),

  input: () => ({
    label: faker.lorem.word(),
    placeholder: faker.lorem.sentence(),
    value: faker.lorem.words(5),
  }),

  table: () => ({
    columns: faker.word.words(5).split(' '),
    rows: Array.from({ length: 5 }, () =>
      faker.word.words(5).split(' ')
    ),
  }),
};

/**
 * Reset faker seed for reproducibility
 */
export function resetFakerSeed(seed: number = 12345): void {
  faker.seed(seed);
}
