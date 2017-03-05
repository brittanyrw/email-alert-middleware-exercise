/*In the event of a FooError or BarError, the app should send an email alert to a recipient you specify in a config file (.env).

BizzErrors (roughly one-third of the time) should not trigger email alerts.

Each alert email should have a subject that looks like this: ALERT: a BarError occurred.

The body should summarize what happened and include the error message (err.message) and the stack trace (err.stack).

sendEmail*/


'use strict';

const express = require('express');
const morgan = require('morgan');
// this will load our .env file if we're
// running locally. On Gomix, .env files
// are automatically loaded.
require('dotenv').config();

const {logger} = require('./utilities/logger');
const {email} = require('/emailer');

// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');

const app = express();

// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

app.use((err, req, res, next) => {

  if (err == 'FooError' || err == 'BarError' ) {
    logger.info(`An error message is being sent`);

var data = {
 from: process.env.ALERT_FROM_EMAIL,
 to: process.env.ALERT_TO_EMAIL,
 subject: `Alert a ${err.name} has occured`,
 text: `There has been an error. The error message is ${err.stack}`,
 html: "<p>HTML version</p>"
};
  email.sendEmail(data);
 }
  next();
});

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
