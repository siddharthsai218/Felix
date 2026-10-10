import fs from 'fs';
import path from 'path';

export interface QuestionBankItem {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  difficulty: number;
  competency: string;
  followUpQuestions: string[];
  expectedLearningOutcomes: string[];
}

export interface TargetRole {
  id: string;
  title: string;
  description: string;
  skills: string[];
  competencies: string[];
  questionBank: QuestionBankItem[];
}

export function getAllRoles(): TargetRole[] {
  const rolesDir = __dirname;
  const files = fs.readdirSync(rolesDir).filter(f => f.endsWith('.json'));
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(rolesDir, file), 'utf-8');
    return JSON.parse(content) as TargetRole;
  });
}

export function getRoleById(id: string): TargetRole | undefined {
  const roles = getAllRoles();
  return roles.find(r => r.id === id);
}

export function getQuestionsForRole(roleId: string, count?: number, difficulty?: number): QuestionBankItem[] {
  const role = getRoleById(roleId);
  if (!role) return [];
  
  let questions = role.questionBank;
  
  if (difficulty !== undefined) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  if (count !== undefined && count > 0) {
    // Basic shuffle and pick
    return questions.sort(() => 0.5 - Math.random()).slice(0, count);
  }
  
  return questions;
}
