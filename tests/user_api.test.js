const { test, after, beforeEach, describe } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");
const User = require("../models/user");
const bcrypt = require("bcrypt");

describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "testUser",
      name: "Test User",
      password: "secretTest",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test("creation fails with proper statuscode and message if username is already taken", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "secret",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(result.body.error.includes("expected `username` to be unique"));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("creation fails with statuscode 400 and proper message when username is under 3 characters long", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "Te",
      name: "Test User",
      password: "testPassword",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(
      result.body.error.includes(
        "Username and password must be at least 3 characters long"
      )
    );
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("creation fails with statuscode 400 and proper message when username is missing", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "",
      name: "Test User",
      password: "testPassword",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(result.body.error.includes("Username or password cannot be empty"));
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("creation fails with statuscode 400 and proper message when password is under 3 characters long", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "testUser",
      name: "Test User",
      password: "te",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(
      result.body.error.includes(
        "Username and password must be at least 3 characters long"
      )
    );
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("creation fails with statuscode 400 and proper message when password is missing", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username:"testUser",
      name: "Test User",
      password: ""
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    assert(result.body.error.includes("Username or password cannot be empty"));
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

after(async () => {
  await mongoose.connection.close();
});
