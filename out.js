var LogLevel = {
	TRACE : {
		value : 0,
		fxn : 't',
		name : 'TRACE'
	},
	DEBUG : {
		value : 10,
		fxn : 'd',
		name : 'DEBUG'
	},
	INFO : {
		value : 20,
		fxn : 'i',
		name : 'INFO '
	},
	WARN : {
		value : 30,
		fxn : 'w',
		name : 'WARN '
	},
	ERROR : {
		value : 40,
		fxn : 'e',
		name : 'ERROR'
	},
	FATAL : {
		value : 50,
		fxn : 'f',
		name : 'FATAL'
	}
};

var __logLevel = LogLevel.INFO;

function t(msg) {
	doLog(msg, LogLevel.TRACE);
}
function d(msg) {
	doLog(msg, LogLevel.DEBUG);
}
function i(msg) {
	doLog(msg, LogLevel.INFO);
}
function w(msg) {
	doLog(msg, LogLevel.WARN);
}
function e(msg) {
	doLog(msg, LogLevel.ERROR);
}
function f(msg) {
	doLog(msg, LogLevel.FATAL);
}

function setLevel(newLevel) {
	t('Changing log level from ' + __logLevel.name + ' to ' + newLevel.name);
	__logLevel = newLevel;
	t('Changed log level from ' + __logLevel.name + ' to ' + newLevel.name);
}

function doLog(msg, level) {
	if (__logLevel.value <= level.value) {
		console.log(date() + ' [' + level.name + '] ' + msg);
	}
}

function date() {
	return (new Date()).toISOString();
}

function testAll() {
	for ( var lvl in LogLevel) {
		setLevel(LogLevel[lvl]);
		outAll();
	}
}

function outAll() {
	console.log('========================================================');
	console.log('Checking level ' + __logLevel.name);
	t('Testing TRACE');
	d('Testing DEBUG');
	i('Testing INFO');
	w('Testing WARN');
	e('Testing ERROR');
	f('Testing FATAL');
	console.log(' ');
}

module.exports = {
	LogLevel : LogLevel,
	level : setLevel,
	t : t,
	d : d,
	i : i,
	w : w,
	e : e,
	f : f,
	test : testAll
};
