const { test, after, beforeEach, describe } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");
const Blog = require("../models/blog");

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

describe("when there is initially some blogs saved", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("there are two blogs", async () => {
    const res = await api.get("/api/blogs");
    assert.strictEqual(res.body.length, helper.initialBlogs.length);
  });
});

describe("viewing a specific blog", () => {
  test("blog id is in a valid form", async () => {
    const res = await api.get("/api/blogs");

    assert.strictEqual(res.status, 200);

    assert(Array.isArray(res.body));

    res.body.forEach((blog) => {
      assert(blog.id !== undefined);
      assert(blog._id === undefined);
    });
  });
});

describe("addition of a new blog", async () => {
  test("a valid blog can be added", async () => {
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

  test("if there are no likes, likes should be zero", async () => {
    const newBlog = {
      title: "emptyLikesTest",
      author: "emptyLikesTest",
      url: "emptyLikesTest",
    };

    const res = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(res.body.likes, 0);
  });

  test("post request with no title returns http-status 400", async () => {
    const newBlog = {
      author: "noTitleTest",
      url: "noTitleTest",
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(400)
      .expect("Content-Type", /application\/json/);
  });

  test("post request with no url returns http-status 400", async () => {
    const newBlog = {
      title: "noUrlTest",
      author: "noUrlTest",
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(400)
      .expect("Content-Type", /application\/json/);
  });
});

describe("deletion of a blog", async () => {
  test("succeeds with a status code 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDB();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await helper.blogsInDB();

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);

    const title = blogsAtEnd.map((b) => b.title);
    assert(!title.includes(blogToDelete.title));
  });

  test("fails with a status code of 400 if id is invalid", async () => {
    const blogsAtStart = await helper.blogsInDB();
    const invalidId = "123";

    await api.delete(`/api/blogs/${invalidId}`).expect(400);

    const blogsAtEnd = await helper.blogsInDB();

    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length);
  });
});

after(async () => {
  await mongoose.connection.close();
});
