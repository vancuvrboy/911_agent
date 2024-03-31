/*
function testDoPost() {
  var simulatedEvent = {
    postData: {
      type: "application/json",
      contents: JSON.stringify({
        // Adjusting the query to be an array of message objects
        query: JSON.stringify([
          {"role": "user", "content": "Why is the sky blue (and other metaphysical questions)?"}
        ])
      }),
      length: 1000 // This is optional; just an example property
    }
  };
  
  // Call doPost with the simulated event
  var result = doPost(simulatedEvent);
  
  // Assuming Logger.log is defined or using console.log for environments like Node.js
  console.log(result.getContent());
}
*/
function doPost(e) {
  
    initial_prompt = 'Your role is to simulate a 911 chatbot, offering guidance and support. You are \
    not on a telephone call. The user has initiated this and you answer as directed below. Your \
    initial question to user should always \
    be "police, fire, or ambulance." Depending on their response, either directly by \
    answering one of these options or by describing their emergency, proceed first by \
    reassuring them, then asking clarifying questions. If a specific service is requested, \
    follow up by asking their location, then telling them the service has been called \
    and they are on the way. If they have not asked for a specific service, ask \
    clarifying questions to categorize \
    the chat into one of the predefined scenarios and follow the outlined procedure that \
    would be most appropriate based on your training. \
    Your responses should be calm, clear, and informative, prioritizing the users \
    immediate safety and ensuring appropriate information is relayed for emergency response. \
    Emphasize clear instructions and questions to assess the situation quickly. \
    Avoid speculation, advice, or personal opinion, sticking to protocol and facilitating \
    the connection to the appropriate emergency services. If certain information is \
    missing or the situation is unclear, ask targeted questions to fill in gaps. Adopt a \
    supportive tone, reassuring the user while gathering essential details. Your \
    primary goal is to simulate the scenario accurately, providing a safe space for \
    understanding emergency protocols and procedures. Stay with the user until emergency services arrive \
    or the situation is resolved, ensuring they feel supported and informed throughout the process.';
    
    // Parse the incoming request
    var requestData = JSON.parse(e.postData.contents);
    var userMessages = JSON.parse(requestData.query);
    
    // Set up the URL for the OpenAI Chat API
    var apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Prepare the data to send in the POST request
    // Adjust the structure to match the chat completions endpoint requirements

    // Define the initial messages to prepend
    var initialMessages = [
        {"role": "system", "content": "you are a 911 operator"},
        {"role": "user", "content": initial_prompt}
    ];

    // Combine the initial messages with the user messages
    var message_stream = initialMessages.concat(userMessages);
    
    
    var data = {
        model: "gpt-4-turbo-preview", // Ensure you're using the correct model for your needs
        messages : message_stream,
        temperature : 0.2,
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer xxxx' // Replace YOUR_API_KEY with your actual OpenAI API key
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    };
    
    // Call the OpenAI API
    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseText = response.getContentText();
    return ContentService.createTextOutput(responseText)
      .setMimeType(ContentService.MimeType.JSON);
  }


