const axios = require("axios");
const path = require("path");
const winston = require("winston");
const Checklist = require("../util/checklist");

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.printf(info => `[${path.basename(__filename).split(".")[0]}]: ${info.message}`),
        winston.format.colorize({ all: true }),
    ),
    transports: [
        new winston.transports.Console(),
    ]
});

axios.defaults.baseURL = `http://localhost:3000`;

// retrieve checklists by user
async function retrieveChecklists(user) {
    logger.info(`Send GET request to retrieve checklists for user "${user}"`);

    // send GET request passing user as query string
    try {
        let response = await axios.get(`/checklist/findByUser`, { params: { user: user } });
        userChecklists = Array.from(response.data);
        userChecklists.forEach(checklist => {
            logger.info(`RESULT - ${new Checklist(checklist.name, checklist.user, checklist.todo).toString()}`);
        });
    } catch (error) {
        logger.error(error);
    }
}

// add new checklist
async function addChecklist(checklist) {
    logger.info(`Send POST request to insert new checklist`);

    // send POST request
    try {
        let response = await axios.post(`/checklist`, checklist);
        logger.info(`RESULT - New checklist: ${new Checklist(response.data.name, response.data.user, response.data.todo).toString()}`);
    } catch (error) {
        logger.error(error);
    }
}

// add new TODO to checklist of the user
async function addTodo(name, user, description) {
    logger.info(`Send POST request to add TODO "${description}"" to checklist "${name}" of user "${user}"`);

    // send POST request
    try {
        let response = await axios.post(`/checklist/addTodo`, {
            name: name,
            user: user,
            description: description
        });
        logger.info(`RESULT - Updated checklist: ${new Checklist(response.data.name, response.data.user, response.data.todo).toString()}`);
    } catch (error) {
        logger.error(error);
    }
}

// update TODO of the checklist of the user
async function updateTodo(name, user, description, done) {
    logger.info(`Send POST request to mark as ${done ? "done" : "not done"} TODO "${description}"" of checklist "${name}" of user "${user}"`);

    // send POST request
    try {
        let response = await axios.post(`/checklist/updateTodo`, {
            name: name,
            user: user,
            description: description,
            done: done
        });
        logger.info(`RESULT - Updated checklist: ${new Checklist(response.data.name, response.data.user, response.data.todo).toString()}`);
    } catch (error) {
        logger.error(error);
    }
}

// delete a checklist of a user
async function deleteChecklist(name, user) {
    logger.info(`Send DELETE request to delete checklist "${name}" of user "${user}"`);

    // send delete request
    try {
         let response = await axios.delete(`/checklist`, {
            params:
            {
                name: name,
                user: user
            }
        });
        logger.info(`RESULT - ${response.data}`);
    } catch (error) {
        logger.error(error);
    }
}

async function main() {
    await retrieveChecklists("Chiara");

    await addChecklist(new Checklist("Gym list", "Chiara", new Array()));

    await addTodo("Gym list", "Chiara", "Make exercises");

    await deleteChecklist("Gym list", "Chiara");

    await updateTodo("Gym list", "Chiara", "Make exercises", true);

    await deleteChecklist("Gym list", "Chiara");
}

main()
