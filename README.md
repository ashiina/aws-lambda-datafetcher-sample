# aws-lambda-datafetcher-sample
Sample (proof of concept) for data fetching with Amazon Lambda &amp; SQS


### Concepts
I wanted to see if I can develop a way to query and get data from a database, without directly querying the database from the client. I wanted to try to implement a **data retrieval request-response** model, just using AWS's fully managed services.

But since Amazon Lambda does not have a way to return data after invokation, it seemed extremely hard, if not impossible, to create such a thing.  

I thought that if I use it together with SQS long-polling, it may be possible to implement an asynchronous data retrieval request.  
So this is a proof-of-concept showing how that can be done. 

### Implications
Being able to fetch data just with Lambda & SQS means that entire application backends can be made just with this technology and a database; Without managing any EC2 instances (a 2-Tier architecture, in AWS terms).  

This proof-of-concept only uses `fetch_id` as a primary key to retrieve data, but this idea can be extended to executing more complex queries, or even passing raw SQL queries over Lambda into RDS.  


### Limitations
Since this fetching goes through multiple HTTP request, the response time is not optimal (3~5 seconds on my environment). 


### How it Works
0. Set up:
  1. Create a SQS queue with the name "user-queue-{user_id}", where {user_id} will be the unique ID of the user who will retrieve data.  
    (In a real life setting, each users' SQS should be automatically created upon the creation of that user.)
  2. In `index.html`, set `LambdaDataFetcher.queueUrlPrefix` to the queue URL, without the {user_id} part.  
    (This is so that you can dynamically create queueUrls for each user.)
  3. Create a Lambda function with the dataFetchLambda.js included.
    (In a real life setting, create an external database, whether RDS or DynamoDB, and store data there. Since this is a sample I do not have an external database; Instead I just have a JSON that acts like a database)

1. In `index.html`, LambdaDataFetcher.fetchData() is called with two arguments - fetchId and userId.  
  fetchId will be the primary key ID of the data you want, and userId will be the unique ID of the user (same as the ID in the queue URL).

2. Inside `fetchData()`, first a `sqs.receiveMessage()` will be executed. This is a long-polling request for SQS, and its URL will be the queue URL created earlier with the userId.   
  The timeout is arbitarily set at 10 seconds.

3. Next, a `lambda.invokeAsync()` is executed on the function created earlier. As an argument, a custom event data is sent with three parameters:
  * fetch_id : The fetchId passed in as an argument (primary key of the data you want)
  * sqs_queue_url : The queue URL which you are currently long-polling on
  * nonce : A random nonce created upon this unique request

4. Inside the Lambda function, it will look for the data with the `fetch_id` and stringify its data as a JSON string.

5. The Lambda function will then execute a `sqs.sendMessage()` to the `sqs_queue_url` which was passed in. It will have two parameters in the Message Body:
  * nonce : The exactly same nonce passed in the event data
  * data : The JSON string of the data

6. Back at `index.html`, the SQS which was long-polling will then receive the message sent by Lambda. It will check if the `nonce` is exactly the same as the nonce sent upon invokation, to check that it hasn't received a different object than the one it requested. 

7. If the `nonce` matches, the data is considered valid, is returned to the `callback` function of `fetchData()`. 

8. Finally it will call `sqs.deleteMessage()` to delete the message it successfully received. 



