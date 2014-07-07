#========================
#CONFIG
#========================
set :application, "site"
#========================
#CONFIG
#========================
require           "capistrano-offroad"
offroad_modules   "defaults", "supervisord"
set :repository,  "git@github.com:user/#{application}.git"
set :supervisord_start_group, "name"
set :supervisord_stop_group, "name"
#========================
#ROLES
#========================
set  :gateway,    "#{application}"  # main server
role :app,        "ubuntu@10.3.x.x" # lxc container
 
after "deploy:create_symlink", "deploy:npm_install", "deploy:restart"
