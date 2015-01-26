#!/bin/bash
# 
# Start and stop selenium and the e2e server
#

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
PATH="${DIR}/../bin:${DIR}/../node_modules/.bin:${PATH}"
SELENIUM=${DIR}/../node_modules/protractor/selenium/selenium-server-standalone-*.jar 

SELENIUM_LOG="${DIR}/selenium.log"
APP_LOG="${DIR}/app-e2e.log"


function wait_for_server() {
	is_listening $1
	found=$?
	while [[ $found -ne 0 ]]; do
		sleep 1
		is_listening $1
		found=$?
	done
}

function is_listening() {
	echo "testing if port $1 is listening..."
	nc -z localhost $1
	return $?
}

function server_status() {
	is_listening $2
	if [[ $? -eq 0 ]]; then
		echo "$1 is up"
	else
		echo "$1 is down"
		exit 1
	fi
}

function stop_server() {
	echo -n "Stopping $1... "
	pid=$(cat ${DIR}/${1}.pid 2> /dev/null)
	if [[ -z "$pid" ]]; then
		echo "not found"
		return 1
	else
		kill $pid
		rm "${DIR}/${1}.pid"
		echo "stopped"
	fi
}


function start_servers() {
	gulp e2e

	echo "Starting selenium on port 4444..."
	java -jar $SELENIUM > $SELENIUM_LOG 2>&1 &
	SELENIUM_PID=$!
	echo -n $SELENIUM_PID > "${DIR}/selenium.pid"

	echo "Starting app server on port 5555..."
	./bin/server.js --root=."${DIR}/../e2e/" --port=5555 > $APP_LOG &
	HTTP_SERVER_PID=$!
	echo -n $HTTP_SERVER_PID > "${DIR}/app.pid"

	wait_for_server 5555
	wait_for_server 4444
}


function stop_servers() {
	stop_server 'selenium'
	stop_server 'app'
	exit 0
}


function show_status() {
	server_status "selenium" 4444
	server_status "app server" 5555
}


case $1 in
	start )
		start_servers
		;;
	stop )
		stop_servers
		;;
	status )
		show_status
		;;
	* )
        echo -e "\nUsage: start|stop\n"
        ;;
esac
