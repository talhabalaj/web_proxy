const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios").default;
const queryString = require("querystring");

require('https').globalAgent.options.ca = require('ssl-root-cas/latest').create();

const app = express();

app.use(cors({ credentials: true, origin: process.env.TARGET || process.argv[2] || "http://localhost:34685" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const targetHost = "lms.uet.edu.pk";

const client = axios.create({
  baseURL: `https://${targetHost}`,
  responseType: "stream",
  maxRedirects: 0,
});

app.use(async (req, res) => {
  const requestHeaders = req.headers;
  const requestBody = req.body;
  const requestMethod = req.method;
  const requestUrl = req.url;
  const requestHost = req.hostname;
  const options = {};

  requestHeaders.host = targetHost;
  if (!!requestHeaders.referer) {
    requestHeaders.referer = requestHeaders.referer.replace(requestHost, targetHost).replace("http", "https")
  }

  if (!!requestHeaders.origin) {
    requestHeaders.origin = requestHeaders.origin.replace(requestHost, targetHost).replace("http", "https")
  }

  if (requestMethod == "POST") {
    if (requestHeaders['content-type'] != 'application/json') {
      options.data = queryString.stringify(requestBody);
    } else {
      options.data = requestBody;
    }
  }

  let response;

  try {
    response = await client.request({
      url: requestUrl,
      method: requestMethod,
      headers: requestHeaders,
      ...options,
    });
  } catch (e) {
    if (!!e.response) {
      response = e.response;
    }
  }
  
  if (!!response.headers['set-cookie']) {
    response.headers['set-cookie'] = response.headers['set-cookie']+"SameSite=None;";
  }
  

  res.status(response.status);
  res.header(response.headers);
  response.data.pipe(res);
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listing at localhost:${port}`);
})
