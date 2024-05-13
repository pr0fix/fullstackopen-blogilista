const { test, after, beforeEach } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");
const Blog = require("../models/blog");

beforeEach(async () => {
  await Blog.deleteMany({});

  let blogObject = new Blog(helper.initialBlogs[0]);
  await blogObject.save();

  blogObject = new Blog(helper.initialBlogs[1]);
  await blogObject.save();
});

test.only("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test.only("there are two blogs", async () => {
  const res = await api.get("/api/blogs");

  assert.strictEqual(res.body.length, helper.initialBlogs.length);
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

test.only("a valid blog can be added", async () => {
  const newBlog = {
    title: "anotherTestTitle",
    author: "anotherTestAuthor",
    url: "anotherTestUrl",
    likes: "23",
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const res = await api.get("/api/blogs");

  const contents = res.body.map((r) => r.title);

  assert.strictEqual(res.body.length, helper.initialBlogs.length + 1);

  assert(contents.includes("anotherTestTitle"));
});

after(async () => {
  await mongoose.connection.close();
});
