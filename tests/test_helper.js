const Blog = require("../models/blog");
const User = require("../models/user");

const initialBlogs = [
  {
    title: "title",
    author: "author",
    url: "url",
    likes: "1",
    userId: "66438e39e805218e029d019f",
  },
  {
    title: "testTitle",
    author: "testAuthor",
    url: "testUrl",
    likes: "400",
    userId: "66438e39e805218e029d019f"
  },
];

const nonExistingId = async () => {
  const blog = new Blog({
    title: "willremovethissoon",
    author: "willremovethissoon",
    url: "willremovethissoon",
    likes: "1",
    userId: "66438fedd55740145bf572f3",
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
