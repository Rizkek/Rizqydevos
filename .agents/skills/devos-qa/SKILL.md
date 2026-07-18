---
name: devos-qa
description: Activate when writing tests, ensuring quality assurance, debugging complex errors, or defining test cases for DevOS.
---

# DevOS QA & Testing Guidelines

As the DevOS QA Agent, your responsibility is to ensure maximum stability and reliability across both the frontend and backend. You enforce a strict, repeatable testing culture.

## 1. Testing Stack & Paths
- **Backend (NestJS):** Use `vitest` for unit and integration testing. Test files must be co-located with the implementation (e.g., `projects.service.spec.ts` next to `projects.service.ts`).
- **Frontend (Next.js):** Use `vitest` for React component unit tests (with React Testing Library). E2E tests should use Playwright and reside in `apps/web/e2e/`.
- **Mocks:** Always place mocks in a `__mocks__` folder or define them clearly at the top of the test file.

## 2. Unit Testing Rules (The AAA Pattern)
Every test MUST follow the Arrange, Act, Assert pattern explicitly. Add comments to separate the phases if the test is complex.
```typescript
describe('ProjectsService', () => {
  it('should create a project when data is valid', async () => {
    // Arrange
    const createDto = { name: 'DevOS Core' };
    const expectedProject = { id: 'uuid', name: 'DevOS Core' };
    prismaServiceMock.project.create.mockResolvedValue(expectedProject);

    // Act
    const result = await service.create(createDto);

    // Assert
    expect(prismaServiceMock.project.create).toHaveBeenCalledWith({ data: createDto });
    expect(result).toEqual(expectedProject);
  });
});
```

## 3. Database Isolation in Tests
- **NEVER** run unit tests against the real PostgreSQL database. 
- You MUST mock the `PrismaService` using `vitest-mock-extended` or manual stubbing.
- For backend integration testing (e.g., testing the actual DB), use an isolated SQLite in-memory database or a dedicated test Docker container, ensuring tables are truncated between tests.

## 4. Frontend Component Testing
- Do not test implementation details (e.g., testing if a specific state variable changes).
- Test user behavior: "When a user clicks the Submit button, the loading spinner appears, and the form is submitted."
- Enforce accessibility: Use `getByRole` or `getByLabelText` over `getByTestId` whenever possible.

## 5. Debugging & Error Hunting Protocol
When a user reports a bug, do not immediately write code to fix it.
1. **Gather Context:** Request logs, inspect the terminal output, or check the DOM.
2. **Reproduce:** Formulate a hypothesis on how to trigger the bug.
3. **Isolate:** Determine if the bug is in the Frontend (UI/State), Backend (Controller/Service), or Database (Schema/Prisma).
4. **Fix & Test:** Apply the fix and write a regression test to ensure it never happens again.
