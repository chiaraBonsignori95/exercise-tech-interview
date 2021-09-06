const express = require("express");
const path = require("path");
const winston = require("winston");
const { MongoClient } = require("mongodb");
const Checklist = require("../util/checklist");
const Todo = require("../util/todo");

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.printf(info => `[${path.basename(__filename).split(".")[0]}]: ${info.message}`),
        winston.format.colorize({ all: true }),
    ),
    transports: [
        new winston.transports.Console(),
    ]
});

// app info
const port = 3000;

// database info
const mongodbName = "ChecklistServiceDB"
const mongodbUri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";
const mongodbClient = new MongoClient(mongodbUri);

async function connectDb() {
    await mongodbClient.connect();
    logger.info(`Connection established with database ${mongodbName}`);

    return mongodbClient.db(mongodbName).collection("checklists");
}

// connect to MongoDB database
connectDb().then((checklistsCollection) => {
    // create application
    let app = express();

    app.use(express.json());

    // configure POST action for endpoint "/checklist" to add a new checklist
    app.post(`/checklist`, (req, res) => {
        // retrieve checklist from the request
        let checklist = new Checklist(req.body.name, req.body.user, req.body.todo);
        logger.info(`Receive POST request to insert new checklist "${checklist.name}" for user "${checklist.user}"`);

        checklistsCollection.insertOne(checklist).then( () => {
            res.send(JSON.stringify(checklist));
        });
    });

    // configure GET action for endpoint "/checklist/findByUser" to retrieve checklists
    app.get(`/checklist/findByUser`, async (req, res) => {
        // retrieve user from request
        let user = req.query.user, userChecklists = new Array();
        logger.info(`Receive GET request to retrieve checklists for user "${user}"`);

        // search checklists of the user in the database
        checklistsCollection.find({ user: user }).forEach(checklist => {;
            userChecklists.push(new Checklist(checklist.name, checklist.user, checklist.todo));
        }).then(() => {
            res.json(userChecklists);
        });
    });

    // configure POST action for endpoint "/checklist/addTodo" to add a new checklist
    app.post(`/checklist/addTodo`, (req, res) => {
        logger.info(`Receive POST request to insert new TODO "${req.body.description}" to checklist "${req.body.name}" of user "${req.body.user}"`);

        // retrieve checklist from db
        checklistsCollection.findOne({ name: req.body.name, user: req.body.user }).then((checklistDocument) => {
            let checklist = new Checklist(checklistDocument.name, checklistDocument.user, checklistDocument.todo);
            checklist.addTodo(new Todo(req.body.description));

            checklistsCollection.replaceOne({ name: req.body.name, user: req.body.user }, checklist).then(() => {
                res.send(JSON.stringify(checklist));
            });
        });
    });

    // configure POST action for endpoint "/checklist/updateTodo" to mark as done or not done a TODO of a checklist
    app.post(`/checklist/updateTodo`, (req, res) => {
        logger.info(`Receive POST request to mark as ${req.body.done ? "done" : "not done"} TODO "${req.body.description}" to checklist "${req.body.name}" of user "${req.body.user}"`);

        // retrieve checklist from db
        checklistsCollection.findOne({ name: req.body.name, user: req.body.user }).then((checklistDocument) => {
            let checklist = new Checklist(checklistDocument.name, checklistDocument.user, checklistDocument.todo);
            checklist.markTodo(req.body.description, req.body.done);

            checklistsCollection.replaceOne({ name: req.body.name, user: req.body.user }, checklist).then(() => {
                res.send(JSON.stringify(checklist));
            });
        });
    });

    // configure DELETE action for endpoint "/checklist" to delete a checklist
    app.delete(`/checklist`, (req, res) => {
        logger.info(`Receive DELETE request to delete checklist "${req.query.name}" of user "${req.query.user}"`);

        // retrieve checklist
        checklistsCollection.findOne({ name: req.query.name, user: req.query.user }).then((checklistDocument) => {
            let checklist = new Checklist(checklistDocument.name, checklistDocument.user, checklistDocument.todo);
            let allDone = true;
            checklist.todo.forEach(t => {
                if (t.done == false) {
                    allDone = false;
                }
            });

            if (!allDone) {
                res.send("Cannot delete checklist, there are undone TODOs");
            } else {
                checklistsCollection.deleteOne({ name: req.query.name, user: req.query.user }).then(() => {
                    res.send("Deleted checklist");
                });
            }
        });
    });

    // start app and listen on port 3000 for requests
    app.listen(port, () => logger.info(`Checklist Application running on port ${port}`));
})
