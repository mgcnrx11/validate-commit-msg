#!/usr/bin/env node

/**
 * Git COMMIT-MSG hook for validating commit message
 * See https://docs.google.com/document/d/1rk04jEuGfk9kYzfqCuOlPTSJw3hEDZJTBN5E5f1SALo/edit
 *
 */

'use strict';

var fs = require('fs');
var util = require('util');
var readline = require('readline');
var resolve = require('path').resolve;
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var semverRegex = function() {
  return /\bv?(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?\b/ig;
};

var config = {};
var MAX_LENGTH = config.maxSubjectLength || 100;
var IGNORED = new RegExp(util.format('(^WIP)|(^%s$)', semverRegex().source));
var TYPES = config.types || ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'];

// fixup! and squash! are part of Git, commits tagged with them are not intended to be merged, cf. https://git-scm.com/docs/git-commit
var PATTERN = /^((fixup! |squash! )?(\w+)(?:\(([^\)\s]+)\))?: (.+))(?:\n|$)/;
var MERGE_COMMIT_PATTERN = /^Merge /;
var error = function() {
  // gitx does not display it
  // http://gitx.lighthouseapp.com/projects/17830/tickets/294-feature-display-hook-error-message-when-hook-fails
  // https://groups.google.com/group/gitx/browse_thread/thread/a03bcab60844b812
  console[config.warnOnFail ? 'warn' : 'error']('INVALID COMMIT MSG: ' + util.format.apply(null, arguments));
};


var validateMessage = function(raw) {
  var messageWithBody = (raw || '').split('\n').filter(function(str) {
    return str.indexOf('#') !== 0;
  }).join('\n');

  var message = messageWithBody.split('\n').shift();

  if (message === '') {
    console.log('Aborting commit due to empty commit message.');
    return false;
  }

  var isValid = true;

  if (MERGE_COMMIT_PATTERN.test(message)) {
    console.log('Merge commit detected.');
    return true
  }

  if (IGNORED.test(message)) {
    console.log('Commit message validation ignored.');
    return true;
  }

  var match = PATTERN.exec(message);

  if (!match) {
    error('does not match "<type>(<scope>): <subject>" !');
    isValid = false;
  } else {
    var firstLine = match[1];
    var squashing = !!match[2];
    var type = match[3];
    var scope = match[4];
    var subject = match[5];

    var SUBJECT_PATTERN = new RegExp(config.subjectPattern || '.+');
    var SUBJECT_PATTERN_ERROR_MSG = config.subjectPatternErrorMsg || 'subject does not match subject pattern!';

    if (firstLine.length > MAX_LENGTH && !squashing) {
      error('is longer than %d characters !', MAX_LENGTH);
      isValid = false;
    }

    if (TYPES !== '*' && TYPES.indexOf(type) === -1) {
      error('"%s" is not allowed type !', type);
      isValid = false;
    }

    if (!SUBJECT_PATTERN.exec(subject)) {
      error(SUBJECT_PATTERN_ERROR_MSG);
      isValid = false;
    }
  }

  // Some more ideas, do want anything like this ?
  // - Validate the rest of the message (body, footer, BREAKING CHANGE annotations)
  // - allow only specific scopes (eg. fix(docs) should not be allowed ?
  // - auto correct the type to lower case ?
  // - auto correct first letter of the subject to lower case ?
  // - auto add empty line after subject ?
  // - auto remove empty () ?
  // - auto correct typos in type ?
  // - store incorrect messages, so that we can learn

  isValid = isValid || config.warnOnFail;

  if (isValid) { // exit early and skip messaging logics
    return true;
  }

  var argInHelp = config.helpMessage && config.helpMessage.indexOf('%s') !== -1;

  if (argInHelp) {
    console.log(config.helpMessage, messageWithBody);
  } else if (message) {
    console.log(message);
  }

  if (!argInHelp && config.helpMessage) {
    console.log(config.helpMessage);
  }

  return false;
};


// publish for testing
exports.validateMessage = validateMessage;
exports.config = config;


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line) {
  if (line !== undefined) {
    //console.log(line);
    var preReceiveParam = line.split(" ");

    var oldRevision = preReceiveParam[0];
    var newRevision = preReceiveParam[1];
    var refName = preReceiveParam[2];

    console.log("Getting pushing Revisions...");
    var commandRevList = "git rev-list " + oldRevision + ".." + newRevision;
    console.log(commandRevList);

    exec(commandRevList, function(err, stdout, stderr) {
      console.log("Ready to check Revision:")
      console.log(stdout);

      var revArray = stdout.split("\n").filter(function(str) {
        return str.length !== 0;
      });

      //console.log(revArray);
      
      for (var i = 0; i < revArray.length; i++) {
        var commandMsg = 'git log --pretty=format:"%B" -n 1 ' + revArray[i];
        //console.log(commandMsg);
        var msg = execSync(commandMsg).toString();
        console.log("Checking Commit Message of " + revArray[i] + ":");
        console.log(msg.trimRight());
        if (!validateMessage(msg)) {
          console.error("Push validation failed for commit " + revArray[i]);
          process.exit(1);
        } else {
          console.log("OK!\n");
        }
      }

      // checked all commit msg, it's all clear
      process.exit(0);

    });
  }
})