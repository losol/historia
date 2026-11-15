import { describe, expect, it } from 'vitest';
import { repeatedSteps } from './syllabus';

const step = (id: string) => ({ relationTo: 'lessons', value: id });

describe('repeatedSteps', () => {
  it('finds none in an empty syllabus or one without repeats', () => {
    expect(repeatedSteps(undefined)).toBe(0);
    expect(repeatedSteps([])).toBe(0);
    expect(repeatedSteps([{ items: null }, {}])).toBe(0);
    expect(repeatedSteps([{ items: [step('a'), step('b')] }, { items: [step('c')] }])).toBe(0);
  });

  it('finds a lesson twice in one section', () => {
    expect(repeatedSteps([{ items: [step('a'), step('b'), step('a')] }])).toBe(1);
  });

  it('finds a lesson in two sections', () => {
    expect(repeatedSteps([{ items: [step('a')] }, { items: [step('b'), step('a')] }])).toBe(1);
  });

  it('counts each repeated lesson once, however often it is there', () => {
    expect(
      repeatedSteps([{ items: [step('a'), step('a'), step('a'), step('b'), step('b')] }]),
    ).toBe(2);
  });

  // The value is the id when it comes from the form, the document when populated.
  it('reads a populated step by its id', () => {
    const populated = { relationTo: 'lessons', value: { id: 'a', title: 'A' } };
    expect(repeatedSteps([{ items: [step('a'), populated] }])).toBe(1);
  });

  it('keeps the kinds of step apart', () => {
    const other = { relationTo: 'quizzes', value: 'a' };
    expect(repeatedSteps([{ items: [step('a'), other] }])).toBe(0);
  });
});
