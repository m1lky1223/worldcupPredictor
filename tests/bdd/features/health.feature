Feature: Service Health Check

  Scenario: GraphQL API returns hello world
    Given the API service is running
    When I query the GraphQL endpoint for hello
    Then the response should contain "world"

  Scenario: Frontend Web Dashboard loads
    Given the web service is running
    When I request the home page of the web service
    Then the HTTP status code should be 200
