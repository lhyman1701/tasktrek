export const taskFixtures = {
  valid: {
    content: 'Test task',
    priority: 'p2',
    description: 'Test description'
  },
  withDueDate: {
    content: 'Task with due date',
    dueDate: new Date().toISOString()
  },
  minimal: {
    content: 'Minimal task'
  }
};

export const projectFixtures = {
  valid: {
    name: 'Test Project',
    color: 'blue'
  },
  minimal: {
    name: 'Minimal Project'
  }
};

export const labelFixtures = {
  valid: {
    name: 'Test Label',
    color: 'green'
  },
  minimal: {
    name: 'Minimal Label'
  }
};

export const sectionFixtures = {
  valid: {
    name: 'Test Section'
  }
};
