const { test, after } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

test.only("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test.only("there are two blogs", async () => {
  const res = await api.get("/api/blogs");

  assert.strictEqual(res.body.length, 2);
});

test.only("blog id is in a valid form", async () => {
  const res = await api.get("/api/blogs");

  assert.strictEqual(res.status, 200);

  assert(Array.isArray(res.body));

  res.body.forEach((blog) => {
    assert(blog.id !== undefined);
    assert(blog._id === undefined);
  });
});

after(async () => {
  await mongoose.connection.close();
});
