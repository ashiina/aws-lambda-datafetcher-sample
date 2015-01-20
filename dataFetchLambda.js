// sample database object. can be any database(RDS,DynamoDB)
var sampleDb = {
	1: {
		text: "One Data",
		date: "2015-01-10 5:00:00"
	},
	23: {
		text: "TWOTHREE Data",
		date: "2015-01-15 13:30:00"
	},
	102: {
		text: "Lorem Ipsum...",
		date: "2015-01-16 8:30:00"
	}
};

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

exports.handler = function(event,context){
	console.log(event);
	var id = event.fetch_id;
	var queue_url = event.sqs_queue_url;
	var nonce = event.nonce;
	if (!id || !queue_url || !nonce) {
		console.log("Insufficient params.");
		context.done();
	}

	// get data. can be any database
	var resultObject = {
		"data": sampleDb[parseInt(id)],
		"nonce": nonce
	};
	var resultJson = JSON.stringify(resultObject);
	console.log(resultJson);

	console.log("sending to: "+queue_url);
	var sqs = new AWS.SQS();
	sqs.sendMessage({
		MessageBody: resultJson,
		QueueUrl: queue_url
	}, function(err,data){
		if (err) console.log(err, err.stack); // an error occurred
		else     console.log(data);           // successful response
		context.done();
	});

};



