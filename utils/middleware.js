const {info, error} = require("./logger")

const requestLogger = (request, response, next) => {
    info("Method:", request.method);
    info("Path:", request.path);
    info("Body:", request.body);
    info("---");
    next();
};

const unknownEndpoint = (request, response) => {
    response.status(404).send({error: "unknown endpoint"});
};

const errorHandler = (err, request, response, next) => {
    error(err.message);

    if(err.name === "CastError") {
        return response.status(400).send({err: "malformatted id"});
    } else if (err.name === "ValidationError") {
        return response.status(400).json({error: err.message});
    };
    next(err);
};

module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler
};