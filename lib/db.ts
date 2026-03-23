import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sealed-room.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      one_liner TEXT NOT NULL,
      encrypted_payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id),
      summary TEXT NOT NULL,
      scores TEXT NOT NULL,
      suggested_questions TEXT NOT NULL,
      flags TEXT NOT NULL DEFAULT '[]',
      output_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(submission_id)
    );

    CREATE TABLE IF NOT EXISTS attestations (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id),
      enclave_measurement TEXT NOT NULL,
      quote TEXT NOT NULL,
      receipt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(submission_id)
    );

    CREATE TABLE IF NOT EXISTS judge_answers (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export interface Submission {
  id: string;
  project_name: string;
  one_liner: string;
  encrypted_payload: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at: string;
  processed_at?: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  summary: string;
  scores: string;
  suggested_questions: string;
  flags: string;
  output_hash: string;
  created_at: string;
}

export interface Attestation {
  id: string;
  submission_id: string;
  enclave_measurement: string;
  quote: string;
  receipt: string;
  created_at: string;
}

export function insertSubmission(s: Omit<Submission, 'created_at' | 'processed_at'>) {
  const db = getDb();
  db.prepare(`INSERT INTO submissions (id, project_name, one_liner, encrypted_payload, status) VALUES (?, ?, ?, ?, ?)`).run(s.id, s.project_name, s.one_liner, s.encrypted_payload, s.status);
}

export function getSubmission(id: string): Submission | undefined {
  return getDb().prepare('SELECT * FROM submissions WHERE id = ?').get(id) as Submission | undefined;
}

export function getAllSubmissions(): Submission[] {
  return getDb().prepare('SELECT * FROM submissions ORDER BY created_at DESC').all() as Submission[];
}

export function updateSubmissionStatus(id: string, status: string, processedAt?: string) {
  getDb().prepare('UPDATE submissions SET status = ?, processed_at = ? WHERE id = ?').run(status, processedAt || null, id);
}

export function insertEvaluation(e: Omit<Evaluation, 'created_at'>) {
  getDb().prepare(`INSERT INTO evaluations (id, submission_id, summary, scores, suggested_questions, flags, output_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(e.id, e.submission_id, e.summary, e.scores, e.suggested_questions, e.flags, e.output_hash);
}

export function getEvaluation(submissionId: string): Evaluation | undefined {
  return getDb().prepare('SELECT * FROM evaluations WHERE submission_id = ?').get(submissionId) as Evaluation | undefined;
}

export function insertAttestation(a: Omit<Attestation, 'created_at'>) {
  getDb().prepare(`INSERT INTO attestations (id, submission_id, enclave_measurement, quote, receipt) VALUES (?, ?, ?, ?, ?)`).run(a.id, a.submission_id, a.enclave_measurement, a.quote, a.receipt);
}

export function getAttestation(submissionId: string): Attestation | undefined {
  return getDb().prepare('SELECT * FROM attestations WHERE submission_id = ?').get(submissionId) as Attestation | undefined;
}

export function insertJudgeAnswer(id: string, submissionId: string, question: string, answer: string) {
  getDb().prepare('INSERT INTO judge_answers (id, submission_id, question, answer) VALUES (?, ?, ?, ?)').run(id, submissionId, question, answer);
}

export function getJudgeAnswers(submissionId: string) {
  return getDb().prepare('SELECT * FROM judge_answers WHERE submission_id = ? ORDER BY created_at ASC').all(submissionId);
}
