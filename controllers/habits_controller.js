// THOUGHTS
// have a habits collection and save the username from the session in it. when user index page loads, find the habit names corresponding to the username and populate the index page - DONE
// save habit _id in every entry. then i can just look up entry with the habits _id and sort them by the timestamp to display calender view - DONE

const express = require('express');
const Habit = require('../models/habits_model.js');
const User = require('../models/users_model.js');
const Entry = require('../models/entries_model.js');
const habits = express.Router();
const getDay = require('date-fns/getDay');
const getDate = require('date-fns/getDate');
const subDays = require('date-fns/subDays');
const addDays = require('date-fns/addDays');
const isSameWeek = require('date-fns/isSameWeek');
const getMonth = require('date-fns/getMonth');
const isSameMonth = require('date-fns/isSameMonth');
const getWeek = require('date-fns/getWeek');

// MIDDLEWARE
const isAuthenticated = (req, res, next) => {
    if (req.session.currentUser) {
        return next();
    } else {
        res.redirect('/sessions/new');
    }
};

// ROUTES
// index
habits.get('/', (req, res) => {
    // res.send('Hello hello, I see you\'ve authenticated');
    if (req.session.currentUser) {
        // if authenticated
        Habit.find({ user: req.session.currentUser.username }, (err, allHabits) => {
            console.log(allHabits);
            if (allHabits.length == 0) {
                res.render('habits/index.ejs', {
                    habits: '',
                    currentUser: req.session.currentUser,
                    entries: '',
                    tabTitle: 'Home'
                });
            }
            let promArray = [];
            for (habit of allHabits) {
                // console.log('habit._id: ', habit._id);
                // let prom = Entry.find({ habit_id: habit._id }, (err, habitEntries) => {
                //     // console.log('habitEntries: ', habitEntries);
                // });
                // todaysDate = Date.now();
                // todaysDate = 1604975157204;
                // todaysDate = 1605407209272;
                todaysDate = 1606012009272;
                // todaysDate = 1606263181218;

                //sort date wise first
                let query = Entry.find({ habit_id: habit._id }).sort({ date: 1 });
                const prom = query.exec();
                promArray.push(prom);
            }

            Promise.all(promArray).then((allEntries) => {
                //lets check if the week has changed
                // let diffInWeeks = 0;
                let lastDateOfEntry = allEntries[0][allEntries[0].length - 1].date;
                let diffInWeeks = getWeek(todaysDate) - getWeek(lastDateOfEntry);
                console.log(lastDateOfEntry, todaysDate, diffInWeeks);

                if (diffInWeeks > 0) {
                    console.log("entered conditional loop: \n");
                    firstDayForEntry = addDays(lastDateOfEntry, 1);
                    let promArray2 = [];
                    for (habit of allHabits) {
                        for (let i = 0; i < 7 * diffInWeeks; i++) {
                            let entryDate = addDays(firstDayForEntry, i);
                            console.log(entryDate);
                            let prom2 = Entry.create({ habit_id: habit['_id'], date: entryDate });
                            promArray2.push(prom2);
                        }
                    }
                    Promise.all(promArray2).then((createdEntries) => {
                        console.log(allEntries);
                        let weeksEntries = []
                        for (entries of allEntries) {
                            entries = entries.slice(entries.length - 7);
                            entries = entries.splice(7, 7);
                            weeksEntries.push(entries);
                        }
                        // console.log(weeksEntries);
                        res.render('habits/index.ejs', {
                            habits: allHabits,
                            currentUser: req.session.currentUser,
                            entries: weeksEntries,
                            tabTitle: 'Home'
                        });
                    });
                } else {
                    let weeksEntries = []
                    for (entries of allEntries) {
                        entries = entries.slice(entries.length - 7);
                        // entries = entries.splice(7, 7);
                        weeksEntries.push(entries);
                    }
                    // console.log(weeksEntries);
                    res.render('habits/index.ejs', {
                        habits: allHabits,
                        currentUser: req.session.currentUser,
                        entries: weeksEntries,
                        tabTitle: 'Home'
                    });
                }
            });
        });
    } else {
        // if not authenticated
        res.render('habits/index.ejs', {
            habits: '',
            currentUser: '',
            entries: '',
            tabTitle: 'Home'
        });
    }
});

// new
habits.get('/new', isAuthenticated, (req, res) => {
    // res.send('new');
    res.render('habits/new.ejs', {
        tabTitle: 'New habit',
        currentUser: req.session.currentUser
    });
});

//create
habits.post('/', isAuthenticated, (req, res) => {
    req.body.done = false;
    req.body.user = req.session.currentUser.username;
    req.body.name = req.body.name.toLowerCase().charAt(0).toUpperCase() + req.body.name.toLowerCase().slice(1);
    req.body.category = req.body.category.toLowerCase().charAt(0).toUpperCase() + req.body.category.toLowerCase().slice(1);
    req.body.date = Date.now();
    Habit.create(req.body, (err, createdHabit) => {
        if (err) {
            console.log(err);
        } else {
            // console.log(createdHabit);
            // adding dates to each entry
            let creationDate = Date.now();
            let creationDayOfWeek = getDay(creationDate);

            // create default false entries for a week
            let promArray = [];
            for (let i = 0; i < 7; i++) {
                let diff = i - creationDayOfWeek;
                let entryDate = subDays(creationDate, diff);
                console.log(entryDate);
                let prom = Entry.create({ habit_id: createdHabit['_id'], date: entryDate });
                promArray.push(prom);
            }
            Promise.all(promArray).then((allEntries) => {
                res.redirect('/habits/');
            });
        }
    });
});

// make a daily entry
habits.patch('/:id/entry', (req, res) => {
    // req.body.habit_id = req.params.id;
    if (req.body.done === "false") {
        req.body.done = true;
    } else {
        req.body.done = false;
    }
    console.log(req.body);
    // res.send(req.body);
    Entry.findByIdAndUpdate(req.params.id, { $set: { done: req.body.done } }, (err, result) => {
        res.redirect('/habits/');
    });
});

// show
habits.get('/:id', (req, res) => {
    // res.send(`show ${req.params.id}`);
    Habit.findById(req.params.id, (err, foundHabit) => {
        // let query = Entry.find({ habit_id: foundHabit._id }, (err, habitEntries) => {
        //     // console.log('habitEntries: ', habitEntries);
        // });
        let query = Entry.find({ habit_id: foundHabit._id }).sort({ date: 1 });

        let thisMonth = getMonth(Date.now());

        const prom = query.exec();
        prom.then((allEntries) => {
            // console.log(allEntries);
            res.render('habits/show.ejs', {
                tabTitle: foundHabit.name,
                currentUser: req.session.currentUser,
                habit: foundHabit,
                id: req.params.id,
                entries: allEntries,
                // months: ['December', 'November', 'October', 'September']
                currentMonth: thisMonth,
                months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].splice((12 - thisMonth + 5), 4)
            });
        });
    });
});

// edit
habits.get('/:id/edit', (req, res) => {
    // res.send(`edit ${req.params.id}`);
    Habit.findById(req.params.id, (err, foundHabit) => {
        console.log(foundHabit);
        res.render('habits/edit.ejs', {
            tabTitle: 'Edit habit',
            currentUser: req.session.currentUser,
            habit: foundHabit,
            id: req.params.id
        });
    });
});

// update
habits.put('/:id', (req, res) => {
    // console.log(req.body);
    // res.send(`update ${req.params.id}`);
    req.body.name = req.body.name.toLowerCase().charAt(0).toUpperCase() + req.body.name.toLowerCase().slice(1);
    req.body.category = req.body.category.toLowerCase().charAt(0).toUpperCase() + req.body.category.toLowerCase().slice(1);

    Habit.findByIdAndUpdate(req.params.id, { $set: { name: req.body.name, category: req.body.category } }, (err, result) => {
        res.redirect(`/habits/${req.params.id}`);
    });
});

// delete
habits.delete('/:id', (req, res) => {
    // res.send(`delete ${req.params.id}`);
    Habit.findByIdAndDelete(req.params.id, (err, toDeleteHabit) => {
        Entry.findByIdAndDelete({ habit_id: toDeleteHabit._id }, (err, toDeleteEntries) => {
            res.redirect('/habits');
        });
    });
});

module.exports = habits;