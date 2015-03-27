# pb-monitor-tickets

This app checks whether tickets to sport events in **Ukraine** are available, and sends email when they are.

## Usage

1. Find out an event id from here: https://bilet.privatbank.ua/sports (come on, you are an engineer!)
2. Put it into config.json, under ```pbApi.json.eventId```
3. ```npm install```
4. Run: ```node index.js gmail-username@gmail.com p455w0rd```

If tickets are available the program will send email to ```gmail-username@gmail.com```

### Make a cron job

Run a program every hour:
```bash
$ env EDITOR=vim crontab -e

0 * * * * cd ~/path/to/pb-monitor-tickets && export PATH=./node_modules/.bin:$HOME/.nvm/v0.10.33/bin:$PATH && node index.js gmail-username@gmail.com p455w0rd >> pb-monitor-tickets.log 2>&1

# :wq
```

export PATH is needed to tell where phantomjs and node binaries live.

### Do not forget to check your email. Cheers!