# Class Mentors and SingPathFire Contributions

Pull Resquests (PR) are welcomes.


## Your fork

1. visit https://github.com/ChrisBoesch/singpathfire
2. click the fork button
3. clone your fork locally:

   ```
   git clone git@github.com:<your-git-username>/singpathfire.git
   cd singpathfire
   git remote add upstream https://github.com/ChrisBoesch/singpathfire.git
   ```

4. start the docker based server on port 8888
   (assuming you have docker running, see [README](./README.md)): `make run`


## Feature branch

Avoid working on fixes and new feature in your master branch. It will prevent
you from submitting focussed pull request or it might prevent you from working 
on more than one fix/feature at a time.

Instead create a branch for each fix or feature:
```shell
git checkout master
git pull upstream master
git checkout -b <branch-name>
```

Work and commit the fixes/features, and then push your branch:
```shell
git push origin <branch-name>
```

Visit your fork and send a Pull Request from that branch; the PR form URL
will have this form:

	https://github.com/ChrisBoesch/singpathfire/compare/master...<your-github-username>:<branch-name>

Once your PR is accepted:
```shell
git push origin --delete <branch-name>
git checkout master
git branch -D <branch-name>
git pull upstream master
```



## Test your code

Test your code and style before submitting a PR.

```
make test
```

See [README](./README.md) for more details.
