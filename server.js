const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8181, clientTracking: true });

const entries = {
  1: {
    id: 1,
    time: 1523882285668,
    title: "WebSocket Basics",
    description:
      "Basics of WebSocket API on the client and node.js (ws library)"
  },
  2: {
    id: 2,
    time: 1523993998243,
    title: "second entry",
    description: "Testing insersions of new entries"
  }
};

let count = 2;

function isValid(message) {
  return /all|getId|create|delete/.test(message.type);
}

function sendToAllConnections(message) {
  wss.clients.forEach(connection => {
    if (connection.readyState === 1) connection.send(message);
  });
}

wss.on("connection", ws => {
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", message => {
    const messageObj = JSON.parse(message);
    if (isValid(messageObj)) {
      if (messageObj.type === "delete") {
        sendToAllConnections(message);
      }

      if (messageObj.type === "create") {
        console.log("create req");
        count += 1;
        messageObj.id = count;
        sendToAllConnections(JSON.stringify(messageObj));

        delete messageObj.type;
        entries[count] = messageObj;
      }

      if (messageObj.type === "all") {
        const allOut = { type: "all", entries: { ...entries } };
        ws.send(JSON.stringify(allOut));
      }
    }
  });

  ws.on("close", (code, reason) =>
    console.log(`Connection closed with code ${code}: ${reason}`)
  );

  ws.on("error", e => console.log(e));
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();

    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 20000);
