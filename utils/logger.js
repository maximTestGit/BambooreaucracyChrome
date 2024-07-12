const logLevel = {
	debug: 'debug',
	info: 'info',
	warn: 'warn',
	error: 'error'
  };

  const logPrefix = 'Bambooreaucracy';
  const theLogLevel = logLevel.info;
  var sequenceNumber = 0;
  // @ts-ignore
  self.printLog = function (module, level, message) {
	sequenceNumber++;
	if (theLogLevel <= level) {
	  console.log(`${logPrefix}(${module}::${logLevel[level]}): ${message}`);
	  // console.log(`${logPrefix}(${module}::${sequenceNumber}::${logLevel[level]}): ${message}`);
	}
  }
  
  // @ts-ignore
  self.printDebug = function (module, message) {
	// @ts-ignore
	self.printLog(module, logLevel.debug, message);
  }
  
  // @ts-ignore
  self.printInfo = function (module, message) {
	// @ts-ignore
	self.printLog(module, logLevel.info, message);
  }
  
  // @ts-ignore
  self.printWarn = function (module, message) {
	// @ts-ignore
	self.printLog(module, logLevel.warn, message);
  }