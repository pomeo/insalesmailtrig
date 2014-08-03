#========================
#CONFIG
#========================
set :application, "test4.sovechkin.com"
#========================
#CONFIG
#========================
require           "capistrano-offroad"
offroad_modules   "defaults", "supervisord"
set :repository,  "git@github.com:pomeo/insalesmailtrig.git"
set :supervisord_start_group, "test4"
set :supervisord_stop_group, "test4"
#========================
#ROLES
#========================
set  :gateway,    "#{application}"   # main server
role :app,        "ubuntu@10.3.42.4" # lxc container

after "deploy:create_symlink", "deploy:npm_install", "deploy:restart"
