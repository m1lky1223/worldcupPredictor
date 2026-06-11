import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { existsSync } from "fs";

const isDocker = existsSync("/.dockerenv") || process.env.IS_DOCKER === "true";
const apiHost = isDocker ? "api" : "localhost";
const webHost = isDocker ? "web" : "localhost";

const apiUrl = `http://${apiHost}:4000/graphql`;
const webUrl = `http://${webHost}:3000`;

let graphqlResponse: any = null;
let webResponseStatus: number = 0;

Given("the API service is running", async function () {
  // Handled transitively
});

When("I query the GraphQL endpoint for teams", async function () {
  const query = JSON.stringify({ query: "{ teams { id name } }" });
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: query,
  });
  graphqlResponse = await res.json();
});

Then("the response should contain teams data", function () {
  assert.ok(graphqlResponse, "No GraphQL response received");
  assert.ok(Array.isArray(graphqlResponse.data?.teams), "Response does not contain teams array");
  assert.ok(graphqlResponse.data.teams.length > 0, "Teams array is empty");
});

Given("the web service is running", async function () {
  // Handled transitively
});

When("I request the home page of the web service", async function () {
  const url = `${webUrl}/`;
  console.log(`[TEST] Fetching webUrl: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/html",
      },
    });
    webResponseStatus = res.status;
    console.log(`[TEST] Response status: ${res.status}`);
  } catch (err: any) {
    console.error(`[TEST] Fetch error: ${err.message}`);
  }
});

Then("the HTTP status code should be {int}", function (expected: number) {
  assert.equal(webResponseStatus, expected);
});
