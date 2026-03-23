"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.insertSubmission = insertSubmission;
exports.getSubmission = getSubmission;
exports.getAllSubmissions = getAllSubmissions;
exports.updateSubmissionStatus = updateSubmissionStatus;
exports.insertEvaluation = insertEvaluation;
exports.getEvaluation = getEvaluation;
exports.insertAttestation = insertAttestation;
exports.getAttestation = getAttestation;
exports.insertJudgeAnswer = insertJudgeAnswer;
exports.getJudgeAnswers = getJudgeAnswers;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_PATH = process.env.DB_PATH || path_1.default.join(process.cwd(), 'data', 'sealed-room.db');
const dataDir = path_1.default.dirname(DB_PATH);
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
let db;
function getDb() {
    if (!db) {
        db = new better_sqlite3_1.default(DB_PATH);
        initSchema(db);
    }
    return db;
}
function initSchema(db) {
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
function insertSubmission(s) {
    const db = getDb();
    db.prepare(`INSERT INTO submissions (id, project_name, one_liner, encrypted_payload, status) VALUES (?, ?, ?, ?, ?)`).run(s.id, s.project_name, s.one_liner, s.encrypted_payload, s.status);
}
function getSubmission(id) {
    return getDb().prepare('SELECT * FROM submissions WHERE id = ?').get(id);
}
function getAllSubmissions() {
    return getDb().prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();
}
function updateSubmissionStatus(id, status, processedAt) {
    getDb().prepare('UPDATE submissions SET status = ?, processed_at = ? WHERE id = ?').run(status, processedAt || null, id);
}
function insertEvaluation(e) {
    getDb().prepare(`INSERT INTO evaluations (id, submission_id, summary, scores, suggested_questions, flags, output_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(e.id, e.submission_id, e.summary, e.scores, e.suggested_questions, e.flags, e.output_hash);
}
function getEvaluation(submissionId) {
    return getDb().prepare('SELECT * FROM evaluations WHERE submission_id = ?').get(submissionId);
}
function insertAttestation(a) {
    getDb().prepare(`INSERT INTO attestations (id, submission_id, enclave_measurement, quote, receipt) VALUES (?, ?, ?, ?, ?)`).run(a.id, a.submission_id, a.enclave_measurement, a.quote, a.receipt);
}
function getAttestation(submissionId) {
    return getDb().prepare('SELECT * FROM attestations WHERE submission_id = ?').get(submissionId);
}
function insertJudgeAnswer(id, submissionId, question, answer) {
    getDb().prepare('INSERT INTO judge_answers (id, submission_id, question, answer) VALUES (?, ?, ?, ?)').run(id, submissionId, question, answer);
}
function getJudgeAnswers(submissionId) {
    return getDb().prepare('SELECT * FROM judge_answers WHERE submission_id = ? ORDER BY created_at ASC').all(submissionId);
}
