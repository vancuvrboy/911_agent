/*
function testDoPost() {
  var simulatedEvent = {
    postData: {
      type: "application/json",
      contents: JSON.stringify({
        // Adjusting the query to be an array of message objects
        query: JSON.stringify([
          {"role": "user", "content": "Help, I've fallen and I can't get up!"}
        ])
      }),
      length: 1000 // This is optional; just an example property
    }
  };
  
  // Call doPost with the simulated event
  var result = doPost(simulatedEvent);
  
  // Assuming Logger.log is defined or using console.log for environments like Node.js
  // Extract and log the content from the ContentService object
  if (result && typeof result.getContent === 'function') {
    console.log(JSON.parse(result.getContent()));
  } else {
    console.log(result);
  }
}
*/
function doPost(e) {
    try {
      // Initial parsing of the incoming request
      var requestData = JSON.parse(e.postData.contents);
      //var userMessages = JSON.parse(requestData.query);
      var userMessages = requestData.query;
  
      var OPENAI_API_KEY = 'obscured'; 
      var ASSISTANT_ID = 'asst_W9pYLmjdXEqUPjaZrnHJi6VR';
      var headers = {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      };
      // if this is the first message, then initilize the threadID
      if(userMessages[0].threadID == '0'){
        // Create a thread
        var threadResponse = UrlFetchApp.fetch('https://api.openai.com/v1/threads', {
          'method': 'post',
          'headers': headers,
          'muteHttpExceptions': true
        });
  
        if (threadResponse.getResponseCode() !== 200) {
          throw new Error("Failed to create thread. Response: " + threadResponse.getContentText());
        }
  
        var threadData = JSON.parse(threadResponse.getContentText());
        var threadId = threadData.id;
      } else {
        var threadId = userMessages[0].threadID;
      }
      
      // Send a message to the thread
      var messageResponse = UrlFetchApp.fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        'method': 'post',
        'headers': headers,
        'payload': JSON.stringify({
          'role': userMessages[0].role,
          'content': userMessages[0].content
        }),
        'muteHttpExceptions': true
      });
  
      if (messageResponse.getResponseCode() !== 200) {
        throw new Error("Failed to send message. Response: " + messageResponse.getContentText());
      }
  
      // Run the thread using the assistant
      var runResponse = UrlFetchApp.fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        'method': 'post',
        'headers': headers,
        'payload': JSON.stringify({
          'assistant_id': ASSISTANT_ID
        }),
        'muteHttpExceptions': true
      });
  
      if (runResponse.getResponseCode() !== 200) {
        throw new Error("Failed to run thread. Response: " + runResponse.getContentText());
      }
  
      var runData = JSON.parse(runResponse.getContentText());
      var runId = runData.id;
      var status = runData.status;
      var startTime = new Date().getTime();
  
      // Poll the run status until it is 'completed'
      while (status === 'queued' || status === 'in_progress') {
        Utilities.sleep(500); // Wait for half a second before checking again
        var checkResponse = UrlFetchApp.fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          'method': 'get',
          'headers': headers,
          'muteHttpExceptions': true
        });
        var checkData = JSON.parse(checkResponse.getContentText());
        status = checkData.status;
  
        // Check for timeout to avoid exceeding the execution limit
        var currentTime = new Date().getTime();
        if (currentTime - startTime > 29000) { // 29 seconds limit to be safe
          throw new Error("Timeout waiting for the run to complete.");
        }
      }
  
      // Once the run is completed, fetch the final result
      if (status === 'completed') {
        var messagesResponse = UrlFetchApp.fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          'method': 'get',
          'headers': headers,
          'muteHttpExceptions': true
        });
  
        if (messagesResponse.getResponseCode() === 200) {
          var messagesData = JSON.parse(messagesResponse.getContentText());
          // Iterate over messages to find the assistant's response
          // for (var i = messagesData.data.length - 1; i >= 0; i--) {
          for (var i = 0; i < messagesData.data.length; i++) {
            var message = messagesData.data[i];
            if (message.role === 'assistant' && message.content && message.content.length > 0) {
              var contentItem = message.content.find(c => c.type === 'text');
              if (contentItem && contentItem.text && contentItem.text.value) {
                return ContentService.createTextOutput(JSON.stringify({
                  status: 'success',
                  threadID: threadId,
                  message: contentItem.text.value
                })).setMimeType(ContentService.MimeType.JSON); // Return the text value of the assistant's message
              }
            }
          }
          throw new Error("Assistant's final response not found.");
        } else {
          throw new Error("Failed to fetch messages. Response: " + messagesResponse.getContentText());
        }
      } else {
        throw new Error("Run did not complete successfully. Status: " + status);
      }
    } catch (error) {
      // Catch any errors that occurred during the process
      console.error('Error:', error);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error!',
        message: error.message,
        stack: error.stack,
        receivedData: e.postData.contents
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }  