var http = require("https");

//call rest api 
function apiCall( options,requestObject,response){
	
	return new Promise(function(resolve, reject) {
		
	
	var req = http.request(options, function (res) {
	  var chunks = [];

	  res.on("data", function (chunk) {
		chunks.push(chunk);
	  });

	  //request completed
	  res.on("end", function () {
		var body = Buffer.concat(chunks);
		console.log('request end');
		response.statusCode=200;
		response.body=''+body.toString();
	  });
	});
	

	
	//lidar job request close
	req.on('close', function () {
        console.log("api request closed! "+JSON.stringify(response));
		resolve(response);
    });

	//job creation fail do to timeout
    req.on('timeout', function (e) {
        console.log("api request is Timeout! " + (options.timeout / 1000) + " seconds expired");
		req.destroy();
		response.statusCode=500;
		response.body='api request is Timeout';
		reject(response);
    });

	//an error occur on API call
    req.on('error', function (e) {
		console.log("api request got  error! ", e);
		response.statusCode=500;
		response.body='api request is Timeout';
		reject(response);
			
    });
	

	//add request body json data
	req.write(JSON.stringify(requestObject));

	req.setTimeout(options.timeout);
	
	//call create job API
	req.end();
		

	
	});
	
}

//retry method for async functions accept function ref ,max atempts and timeout
function doRetry(func,attempt,waitTime, ...args){
	
	
	return new Promise(function(resolve, reject) {
		
		if(attempt<0||attempt===0)
		{
			resolve("maximum attempt reached ...");
			return;
		}
		
		console.log('## '+attempt+' attempt left');
		
		//call actual function
		func(...args).then(
			result  =>{ resolve(result); 
			return JSON.stringify(result);
		},function(err) {
			if(attempt<0){ 
				resolve(err);
			}
			else{
				  //recursive call for self to retry 
				  doRetry(func,(attempt-1),waitTime, ...args)
						.then(result  =>{ resolve(result);})
						.catch((err)=>{
							reject(err);
						});
			}
		});
	});
}

//dummy request setup
var Option = {
  "method": "GET", 
  "hostname": "api.exchangeratesapi.io",
  "port": null,
  "timeout":5000,
  "path": "/latest?base=USD",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache"
  }
};



var apiCallRequestObject = {}
var apiResponse={};
var response = doRetry(apiCall,5,10,Option,apiCallRequestObject,apiResponse);
  
response.then(result  =>{
		console.log('#response  '+JSON.stringify(result)) ;
		return JSON.stringify(result);
	}, function(err) {
        console.log('#error occur '+err);
		}
 );


