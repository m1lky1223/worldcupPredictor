Feature: Database Seeding Check

  Scenario: Database contains seeded teams
    Given the database is initialized
    When I query the database for teams
    Then I should find teams registered in the system
