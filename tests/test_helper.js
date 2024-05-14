const Blog = require("../models/blog");
const User = require("../models/user");

const initialBlogs = [
  {
    title: "title",
    author: "author",
    url: "url",
    likes: "1",
  },
  {
    title: "testTitle",
    author: "testAuthor",
    url: "testUrl",
    likes: "400",
  },
];

const nonExistingId = async () => {
  const blog = new Blog({
    title: "willremovethissoon",
    author: "willremovethissoon",
    url: "willremovethissoon",
    likes: "1",
  });
  await blog.save();
  await blog.deleteOne();

  return blog._id.toString();
};

const blogsInDB = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDB = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDB,
  usersInDB,
};
