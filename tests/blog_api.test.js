const { test, after, beforeEach, describe } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");
const Blog = require("../models/blog");
const User = require("../models/user");

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

  test("all blogs are returned", async () => {
    const res = await api.get("/api/blogs");
    assert.strictEqual(res.body.length, helper.initialBlogs.length);
  });

  test("a specific blog is within the returned blogs", async () => {
    const res = await api.get("/api/blogs");

    const titles = res.body.map((r) => r.title);
    assert(titles.includes("title"));
  });
});

describe("viewing a specific blog", () => {
  test("succeeds with a valid id", async () => {
    const res = await api.get("/api/blogs");

    assert.strictEqual(res.status, 200);

    assert(Array.isArray(res.body));

    res.body.forEach((blog) => {
      assert(blog.id !== undefined);
      assert(blog._id === undefined);
    });
  });

  test("fails with statuscode 404 if blog doesn't exist", async () => {
    const validNonexistingId = await helper.nonExistingId();

    await api.get(`/api/blogs/${validNonexistingId}`).expect(404);
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

describe("updation of a blog", async () => {
  test("succeeds with a status code of 200 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDB();
    const blogToUpdate = blogsAtStart[1];

    const updatedData = {
      likes: 5,
    };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedData)
      .expect(200);

    const blogsAtEnd = await helper.blogsInDB();

    const updatedBlog = blogsAtEnd.find((blog) => blog.id === blogToUpdate.id);
    assert.strictEqual(updatedBlog.likes, 5);
  });

  test("fails with a status code of 400 if id is invalid", async () => {
    const blogsAtStart = await helper.blogsInDB();
    const blogToUpdate = blogsAtStart[1];
    const invalidId = "123123";

    const updatedData = {
      likes: 5,
    };

    await api.put(`/api/blogs/${invalidId}`).send(updatedData).expect(400);

    const blogsAtEnd = await helper.blogsInDB();
    const updatedBlog = blogsAtEnd.find((blog) => blog.id === blogToUpdate.id);

    assert.strictEqual(updatedBlog.likes, blogToUpdate.likes);
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
});

after(async () => {
  await mongoose.connection.close();
});
