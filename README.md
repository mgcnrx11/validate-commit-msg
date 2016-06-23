# validate-pre-receive

forked from kentcdodds/validate-commit-msg.

原来的用法是在Client Side作为commit-msg钩子检查Commit Message是否符合要求。

现在修改为用于Server Side作为pre-receive钩子检查Commit Message是否符合要求。

# validate-commit-msg

This provides you a binary that you can use as a githook to validate the commit message. I recommend
[ghooks](http://npm.im/ghooks). You'll want to make this part of the `commit-msg` githook.

Validates that your commit message follows this format:

```
<type>(<scope>): <subject>
```

## Usage

### options

You can specify options in `package.json`

```javascript
{
  "config": {
    "validate-commit-msg": {
      "types": ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "revert"], // default
      "warnOnFail": false, // default
      "maxSubjectLength": 100, // default
      "subjectPattern": ".+", // default
      "subjectPatternErrorMsg": 'subject does not match subject pattern!', // default
      "helpMessage": "" //default
    }
  }
}
```

#### types

These are the types that are allowed for your commit message. If omitted, the value is what is shown above.

You can also specify: `"types": "*"` to indicate that you don't wish to validate types

#### warnOnFail

If this is set to `true` errors will be logged to the console, however the commit will still pass.

#### maxSubjectLength

This will control the maximum length of the subject.

#### subjectPattern

Optional, accepts a RegExp to match the commit message subject against.

#### subjectPatternErrorMsg

If `subjectPattern` is provided, this message will be displayed if the commit message subject does not match the pattern.

#### helpMessage

If provided, the helpMessage string is displayed when a commit message is not valid. This allows projects to provide a better developer experience for new contributors.

The `helpMessage` also supports interpoling a single `%s` with the original commit message.

### Other notes

If the commit message begins with `WIP` then none of the validation will happen.


## Credits

This was originally developed by contributors to [the angular.js project](https://github.com/angular/angular.js). I
pulled it out so I could re-use this same kind of thing in other projects.

[donate-badge]: https://img.shields.io/badge/$-support-green.svg?style=flat-square
[donate]: http://kcd.im/donate
