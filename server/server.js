const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const {sequelize} = require("./sequelize/models");
require("dotenv").config();

const config = require("./config/config").get(process.env.NODE_ENV);

const options = {
  swaggerDefinition:{
      info:{
          title: 'REST API FOR PEN APP',
          version: '1.0.0',
          description: 'Postgres Express Node that consists of CRUD operations',
          servers:["http://localhost:8081"]
      }
  },
  apis: ['swagger.yaml']
}

const swaggerDocs = swaggerJSDoc(options);

//middlewares
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

// logger
if (process.env.NODE_ENV === "production") {
  app.use(
    morgan("common", {
      stream: fs.createWriteStream(path.join(__dirname, "access.log"), {
        flags: "a",
      }),
    })
  );
}

//routes
app.use("/", require("./routes/user"));

// Run server
const port = process.env.PORT || config.PORT;
app.listen(port, async() => {
  const timing = new Date();
  console.log(`App is listing on ${port} at: ${timing}`);
  await sequelize.authenticate();
  console.log("Sequelize Database Connected")
});
