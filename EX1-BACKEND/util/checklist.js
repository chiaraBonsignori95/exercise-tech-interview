const Todo = require("./todo");

module.exports = class Checklist {
    constructor(name, user, todo = new Array()) {
        this.name = name;
        this.user = user;
        this.todo = todo;
    }

    addTodo(todo) {
        this.todo.push(todo);
    }

    markTodo(d, done) {
        let i = this.todo.findIndex( ({ description }) => description === d );
        this.todo[i].done = done;
    }

    toString() {
        let s = `Checklist "${this.name}" of user "${this.user}" with TODOs: [`;
        this.todo.forEach(t => {
            s = s + ` "${t.description}" = ${t.done ? "done" : "not done"} `
        });
        s = s + " ]"

        return s;
    }
}
