// Load third party dependencies
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Load our custom classes
const CustomerStore = require('./customerStore.js');
const MessageRouter = require('./messageRouter.js');

// Grab the service account credentials path from an environment variable
var agentKey = process.env.agentKey;

 if(process.env.AI_KEY_PATH){
 	var fs = require("fs");
	agentKey = fs.readFileSync(process.env.AI_KEY_PATH);
	console.log('credenciales OK');
 }
 else if(!agentKey) {
	console.log('faltan las credenciales');
	process.exit(1);
}
 
	
// Load and instantiate the Dialogflow client library
const { SessionsClient } = require('dialogflow');

	var jsonContent = JSON.parse(agentKey);
	console.log("private_key:", jsonContent.private_key);
	console.log("client_email:", jsonContent.client_email);
	console.log("project_id:", jsonContent.project_id);
	
		const privateKey = jsonContent.private_key
		const clientEmail = jsonContent.client_email
		const projectId = jsonContent.project_id

		let config = {
			credentials: {
				private_key: privateKey,
				client_email: clientEmail
			}
		}

	var dialogflowClient = new SessionsClient(config)


// Instantiate our app
const customerStore = new CustomerStore();
const messageRouter = new MessageRouter({
  customerStore: customerStore,
  dialogflowClient: dialogflowClient,
  projectId: projectId,
  customerRoom: io.of('/customer'),
  operatorRoom: io.of('/operator')
});

// Serve static html files for the customer and operator clients
app.get('/customer', (req, res) => {
  res.sendFile(`${__dirname}/static/customer.html`);
});

app.get('/operator', (req, res) => {
  res.sendFile(`${__dirname}/static/operator.html`);
});

// Begin responding to websocket and http requests
messageRouter.handleConnections();
var number = process.env.PORT || 3000;
http.listen(number, () => {
  console.log('Listening on *:',number);  
});
