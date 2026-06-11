Feature: Service Health Check

  Scenario: GraphQL API returns teams
    Given the API service is running
    When I query the GraphQL endpoint for teams
    Then the response should contain teams data

  Scenario: Frontend Web Dashboard loads
    Given the web service is running
    When I request the home page of the web service
    Then the HTTP status code should be 200
