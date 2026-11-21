import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { FailureCodes } from "@project/contracts";

describe("API Wire Protocol & Validation Suite", () => {
  const app = createApp();

  it("GET /api/health returns WireResult success with HTTP 200", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("value");
    expect(res.body.value).toMatchObject({
      status: "ok",
    });
    expect(res.body.error).toBeUndefined();
  });

  it("POST /api/auth/login rejects invalid body with VALIDATION_ERROR over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.VALIDATION_ERROR);
    expect(res.body.error.details).toBeInstanceOf(Array);
    expect(res.body.value).toBeUndefined();
  });

  it("POST /api/students rejects unauthenticated request with UNAUTHORIZED over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/students")
      .send({
        registrationNumber: 1001,
        name: "Test Student",
        email: "student@example.com",
        batch: "2024",
        department: "CSE",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.UNAUTHORIZED);
    expect(res.body.value).toBeUndefined();
  });

  it("POST /api/exams rejects unauthenticated request with UNAUTHORIZED over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/exams")
      .send({
        title: "Midterm Exam",
        examDate: "2026-12-01T00:00:00.000Z",
        totalMarks: 100,
        status: "draft",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.UNAUTHORIZED);
    expect(res.body.value).toBeUndefined();
  });

  it("POST /api/results rejects unauthenticated request with UNAUTHORIZED over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/results")
      .send({
        studentId: "507f1f77bcf86cd799439011",
        examId: "507f1f77bcf86cd799439012",
        obtainedMarks: 85,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.UNAUTHORIZED);
    expect(res.body.value).toBeUndefined();
  });

  it("GET /api/auth/me rejects unauthenticated request with UNAUTHORIZED over HTTP 200", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.UNAUTHORIZED);
    expect(res.body.value).toBeUndefined();
  });

  it("POST /api/students rejects invalid payload with VALIDATION_ERROR over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/students")
      .send({
        registrationNumber: -5,
        name: "",
        email: "invalid-email",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.VALIDATION_ERROR);
    expect(res.body.value).toBeUndefined();
  });

  it("POST /api/exams rejects invalid payload with VALIDATION_ERROR over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/exams")
      .send({
        title: "",
        examDate: "not-a-date",
        totalMarks: -10,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.VALIDATION_ERROR);
    expect(res.body.value).toBeUndefined();
  });

  it("POST /api/results rejects invalid ObjectId format with VALIDATION_ERROR over HTTP 200", async () => {
    const res = await request(app)
      .post("/api/results")
      .send({
        studentId: "not-an-objectid",
        examId: "not-an-objectid",
        obtainedMarks: -10,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.VALIDATION_ERROR);
    expect(res.body.value).toBeUndefined();
  });

  it("GET /api/leaderboard/invalid-exam-id returns VALIDATION_ERROR with issues list", async () => {
    const res = await request(app).get("/api/leaderboard/invalid-exam-id");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.VALIDATION_ERROR);
    expect(res.body.error.details).toBeInstanceOf(Array);
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(res.body.value).toBeUndefined();
  });

  it("GET /api/exams/invalid-exam-id/leaderboard returns VALIDATION_ERROR with issues list", async () => {
    const res = await request(app).get("/api/exams/invalid-exam-id/leaderboard");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.VALIDATION_ERROR);
    expect(res.body.error.details).toBeInstanceOf(Array);
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(res.body.value).toBeUndefined();
  });

  it("GET /api/unknown returns NOT_FOUND WireResult over HTTP 200", async () => {
    const res = await request(app).get("/api/unknown-endpoint");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(FailureCodes.NOT_FOUND);
    expect(res.body.value).toBeUndefined();
  });
});
