const { info, error } = require("./logger");

const requestLogger = (request, response, next) => {
  info("Method:", request.method);
  info("Path:", request.path);
  info("Body:", request.body);
  info("---");
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (err, request, response, next) => {
  error(err.message);

  if (err.name === "CastError") {
    return response.status(400).send({ err: "malformatted id" });
  } else if (err.name === "ValidationError") {
    return response.status(400).json({ error: err.message });
  } else if (err.name === "MongoServerError" && err.message.includes("E11000 duplicate key error")) {
    return response.status(400).json({ error: "expected `username` to be unique" });
  } else if (err.name === "JsonWebTokenError") {
    return response.status(400).json({ error: "token missing or invalid" });
  } else if (err.name === "TokenExpiredError") {
    return response.status(401).json({error: "token expired",});
  }
  next(err);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
};
