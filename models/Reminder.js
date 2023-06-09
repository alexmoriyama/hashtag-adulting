const { Model, DataTypes } = require("sequelize");

const sequelize = require("../config/connection");
const { sendMail, scheduleJob, cancelJob } = require("../services");

class Reminder extends Model {}

Reminder.init({
    task: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastDone: {
        type: DataTypes.DATEONLY,
    },
    isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    numIntervals: {
        type: DataTypes.INTEGER,
    },
    timeInterval: {
        type: DataTypes.STRING,
    },
    nextDue: {
        type: DataTypes.DATEONLY,
    },
    note: {
        type: DataTypes.TEXT,
    },
},{
    sequelize,
    hooks: {
        afterCreate: handleAfterCreateAndUpdate,
        afterUpdate: handleAfterCreateAndUpdate,
        beforeDestroy: handleBeforeDestroy,
    }
});

async function handleAfterCreateAndUpdate(reminder) {
    // gets User from Reminder's Category
    const category = await reminder.getCategory();
    const user = await category.getUser();

    // creates a job with the `jobName` that is the Reminder's ID
    scheduleJob(
        `${reminder.id}`,
        new Date(reminder.nextDue),
        () => sendMail(user.email, `Reminder: \n${reminder.task} due today! \n${reminder.note}\nhttps://hashtag-adulting.herokuapp.com/dashboard/${reminder.CategoryId}`),
    )
}

function handleBeforeDestroy(reminder) {
    cancelJob(`${reminder.id}`);
}

module.exports = Reminder;